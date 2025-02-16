const args = process.argv.slice(2);

// Check if the required two arguments are provided.
if (args.length < 3) {
	console.error(
		"Usage: node script.js <commentsUrl> <deployUrl> <githubToken>",
	);
	process.exit(1);
}

// Destructure the positional arguments.
const [commentsUrl, deployUrl, githubToken] = args;

postIssueComment();

export async function postIssueComment(): Promise<void> {
	// Construct the request body with the comment content.
	const requestBody = {
		body: deployUrl,
	};

	console.log(deployUrl, commentsUrl, githubToken);

	// Send the POST request to the GitHub API.
	const response = await fetch(commentsUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `token ${githubToken}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "Runestone",
			"X-GitHub-Api-Version": "2022-11-28",
		},
		body: JSON.stringify(requestBody),
	});

	// Check if the request was successful.
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to create comment: ${response.status} ${errorText}`,
		);
	}

	console.log(success);
}
