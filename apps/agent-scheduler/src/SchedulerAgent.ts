import { Agent, type Schedule } from "agents-sdk";
import { createWorkersAI } from "workers-ai-provider";
import { extractActionType } from "./llm/extract-action-type.ts";
import { extractAlarmMessage } from "./llm/extract-alarm-message.ts";
import { extractAlarmType } from "./llm/extract-alarm-type.ts";
import { extractScheduledDate } from "./llm/extract-scheduled-date.ts";
import { extractScheduleId } from "./llm/extract-schedule-id.ts";
import { extractCronSchedule } from "./llm/extract-cron-schedule.ts";

/**
 * Union type representing the different scheduling configurations.
 */
type ConfirmationSchedule =
	| {
			payload: string;
			type: "scheduled";
			date: string;
	  }
	| {
			payload: string;
			type: "delayed";
			time: number;
			delayInSeconds: number;
	  }
	| {
			payload: string;
			type: "cron";
			cron: string;
	  };

/**
 * Union type representing confirmation actions for scheduling operations.
 */
type Confirmation =
	| {
			id: string;
			action: "add";
			schedule: ConfirmationSchedule;
	  }
	| {
			id: string;
			action: "cancel";
			schedule: Schedule;
	  };

/**
 * Interface for the internal state of the SchedulerAgent.
 */
interface SchedulerAgentState {
	confirmations: Confirmation[];
}

/**
 * Agent class specialised in managing scheduling operations.
 */
export class SchedulerAgent extends Agent<{ AI: any }, SchedulerAgentState> {
	/**
	 * Initialises the agent's state with an empty confirmation list.
	 */
	initialState: SchedulerAgentState = {
		confirmations: [],
	};

	/**
	 * Outputs notifications to the console.
	 *
	 * This method exists primarily to provide immediate feedback during development
	 * or debugging, enabling developers to track the flow of data without complex UI overhead.
	 *
	 * @param payload - The content to be notified/logged, allowing insights into runtime behaviour.
	 */
	notify(payload: unknown) {
		console.log(payload);
	}

	/**
	 * Processes user queries and determines the appropriate scheduling action.
	 *
	 * The purpose of this asynchronous function is to integrate with an external AI model
	 * to interpret and act upon natural language queries. By delegating decision-making to the
	 * AI component, the agent can dynamically handle scheduling tasks, such as listing, adding,
	 * or cancelling schedules, in a scalable manner.
	 *
	 * @param query - The user input that is parsed to determine the scheduling operation.
	 * @returns A promise that resolves to a confirmation, a list of schedules, or a message,
	 *          reflecting the dynamic nature of the scheduling workflow.
	 */
	async query(
		query: string,
	): Promise<
		| { confirmation?: Confirmation; message?: string }
		| Schedule[]
		| string
		| undefined
	> {
		// Instantiate the AI model interface to interpret the natural language query.
		const workersai = createWorkersAI({ binding: this.env.AI });
		const aiModel = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");

		// Use the AI model to extract the intended action and any message context.
		const { action, message } = await extractActionType(
			aiModel,
			query,
			this.getSchedules(),
		);

		// Allow the agent to list schedules based on the interpreted intent.
		if (action === "list") {
			return this.getSchedules();
		}

		// Provide feedback if the query does not correspond to any recognised action.
		if (action === "none") {
			return { message };
		}

		// Handle the addition of a new schedule based on user intent.
		if (action === "add") {
			const [payload, scheduleType] = await Promise.all([
				extractAlarmMessage(aiModel, query),
				extractAlarmType(aiModel, query),
			]);

			// We can use the same logic for delayed and schedule as they both refer to a
			// specific time in the future.
			if (scheduleType === "scheduled" || scheduleType === "delayed") {
				const date = await extractScheduledDate(aiModel, query);

				const newConfirmation: Confirmation = {
					id: crypto.randomUUID(),
					action: "add",
					schedule: {
						type: "scheduled",
						date,
						payload,
					},
				};

				// Update the state to reflect the newly added scheduling confirmation.
				this.setState({
					...this.state,
					confirmations: [...this.state.confirmations, newConfirmation],
				});

				return { confirmation: newConfirmation };
			}

			if (scheduleType === "cron") {
				const cron = await extractCronSchedule(aiModel, query);

				const newConfirmation: Confirmation = {
					id: crypto.randomUUID(),
					action: "add",
					schedule: {
						type: "cron",
						cron,
						payload,
					},
				};

				// Update the state to reflect the newly added scheduling confirmation.
				this.setState({
					...this.state,
					confirmations: [...this.state.confirmations, newConfirmation],
				});

				return { confirmation: newConfirmation };
			}
		}

		// Handle cancellation requests by ensuring a valid schedule identifier is present.
		if (action === "cancel") {
			const scheduleId = await extractScheduleId(
				aiModel,
				query,
				this.getSchedules(),
			);

			const schedule = scheduleId && (await this.getSchedule(scheduleId));

			if (!schedule) {
				return {
					message: "No matching task found to cancel.",
				};
			}

			const newConfirmation: Confirmation = {
				id: crypto.randomUUID(),
				action: "cancel",
				schedule,
			};

			// Maintain state consistency by appending the cancellation confirmation.
			this.setState({
				...this.state,
				confirmations: [...this.state.confirmations, newConfirmation],
			});

			return { confirmation: newConfirmation };
		}
	}

	/**
	 * Confirms or rejects a pending scheduling operation based on user input.
	 *
	 * This method is designed to finalise scheduling decisions only after explicit user confirmation.
	 * The structure ensures that accidental actions are mitigated, preserving system integrity and user intent.
	 *
	 * @param confirmationId - The unique identifier for the pending confirmation, ensuring precise targeting.
	 * @param userConfirmed - A boolean representing the user's final decision, which is critical for safe operation.
	 * @returns A promise that resolves to the scheduled task, a message, or a boolean flag indicating failure,
	 *          thus preserving a consistent user-driven workflow.
	 */
	async confirm(
		confirmationId: string,
		userConfirmed: boolean,
	): Promise<Schedule | string | false | undefined> {
		// Locate the confirmation in the current state; this check prevents processing of stale or invalid data.
		const confirmation = this.state.confirmations.find(
			(c) => c.id === confirmationId,
		);

		if (!confirmation) {
			return "No matching confirmation found.";
		}

		let result: Schedule | string | false | undefined;

		if (userConfirmed) {
			const { action } = confirmation;
			if (action === "add") {
				const { schedule } = confirmation;
				const { type, payload } = schedule;

				// Prepare the parameter required for scheduling based on the type.
				let param: Date | number | string = "";

				// Switch-case ensures that each scheduling type is handled appropriately,
				// preserving semantic clarity and type safety.
				switch (type) {
					case "scheduled":
						param = new Date(schedule.date);
						break;
					case "cron":
						param = schedule.cron;
						break;
					case "delayed":
						param = schedule.time;
						break;
					default:
						break;
				}

				// Execute the scheduling operation, bridging user intent with system functionality.
				result = await this.schedule(param, "notify", payload);
			} else if (action === "cancel") {
				const { schedule } = confirmation;
				// Process cancellation, ensuring that the action aligns with user intent.
				await this.cancelSchedule(schedule.id);
				result = schedule;
			}
		} else {
			result = "User chose not to proceed with this action.";
		}

		// Remove the confirmation post-processing to maintain a clean state.
		const remainingConfirmations = this.state.confirmations.filter(
			(c) => c.id !== confirmationId,
		);

		this.setState({
			...this.state,
			confirmations: remainingConfirmations,
		});

		return result;
	}

	/**
	 * Callback triggered upon state updates.
	 *
	 * Logging state updates provides transparency and aids in debugging by
	 * offering insight into the internal state transitions. This is particularly
	 * important in asynchronous environments where state changes may not be immediately apparent.
	 *
	 * @param state - The updated state, which is logged for monitoring purposes.
	 */
	onStateUpdate(state: SchedulerAgentState): void {
		console.log("Scheduler Agent state updated:", state);
	}
}
