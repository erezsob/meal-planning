import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { data } = useSuspenseQuery(convexQuery(api.tasks.getAll));
	const createTask = useMutation(api.tasks.create);
	const updateTask = useMutation(api.tasks.update);
	const deleteTask = useMutation(api.tasks.remove);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const text = formData.get("text") as string;
		createTask({ text, isCompleted: false });
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-white">
					<form onSubmit={handleSubmit}>
						<input type="text" placeholder="Add a task" name="text" />
						<button type="submit">Add</button>
					</form>
					{data.map((task) => (
						<div key={task._id}>
							<h3>{task.text}</h3>
							<p>{task.isCompleted ? "Completed" : "Not Completed"}</p>
							<button
								type="button"
								onClick={() =>
									updateTask({
										id: task._id,
										text: task.text,
										isCompleted: !task.isCompleted,
									})
								}
							>
								{task.isCompleted
									? "Mark as Not Completed"
									: "Mark as Completed"}
							</button>
							<button
								type="button"
								onClick={() => deleteTask({ id: task._id })}
							>
								Delete
							</button>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
