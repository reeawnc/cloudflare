import React from "react";
import { useChat, type Message } from "@ai-sdk/react";
import {
	Center,
	Paper,
	Text,
	TextInput,
	Button,
	Group,
	ScrollArea,
	Stack,
} from "@mantine/core";

/**
 * ChatUI Component
 *
 * This component creates a conversational user interface.
 * It utilises the useChat hook to manage the chat state and stream responses from the worker.
 */
const ChatUI: React.FC = () => {
	const { messages, input, setInput, handleSubmit, setMessages, reload } =
		useChat();

	const onFormSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault();
		handleSubmit();

		const userPrompt = input;
		const newMessage = {
			id: Date.now().toString(),
			role: "user",
			content: userPrompt,
		} as Message;

		const payload = {
			system: "You are a helpful chatbot.",
			maxTokens: 10000,
			messages: [...messages, newMessage],
		};

		const response = await fetch(import.meta.env.VITE_CHAT_SERVER_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.body) {
			console.error("No response body found.");
			return;
		}

		const assistantMessageId = Date.now().toString();
		const newAssistantMessage = {
			id: assistantMessageId,
			role: "assistant",
			content: "",
		} as Message;

		setMessages((prev) => [...prev, newAssistantMessage]);

		const reader = response.body
			.pipeThrough(new TextDecoderStream())
			.getReader();
		let aggregatedContent = "";

		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				console.log("Stream done");
				break;
			}
			aggregatedContent += value;
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === assistantMessageId
						? { ...msg, content: aggregatedContent }
						: msg,
				),
			);
			reload();
		}

		setInput("");
	};

	return (
		<Center style={{ height: "100vh", backgroundColor: "#f5f5f5" }}>
			<Paper shadow="sm" p="md" style={{ width: "90%", maxWidth: 1000 }}>
				<ScrollArea style={{ height: 700, marginBottom: "1rem" }}>
					<Stack gap="xs">
						{messages.map((message) => (
							<Paper key={message.id} p="xs" shadow="xs">
								<Text>{message.role === "user" ? "User" : "Assistant"}:</Text>
								<Text>{message.content}</Text>
							</Paper>
						))}
					</Stack>
				</ScrollArea>
				<form onSubmit={onFormSubmit}>
					<Group>
						<TextInput
							name="chat-input"
							value={input}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setInput(e.target.value)
							}
							placeholder="Type your message..."
							style={{ flexGrow: 1 }}
						/>
						<Button type="submit" variant="filled">
							Send
						</Button>
					</Group>
				</form>
			</Paper>
		</Center>
	);
};

export default ChatUI;
