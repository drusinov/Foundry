async function getProjects() {
  try {
    const response = await fetch("http://backend:8000/api/projects/", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    return response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">
          AI Workspace Platform
        </h1>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            projects.map((project: any) => (
              <div
                key={project.id}
                className="border border-zinc-800 rounded-xl p-6 bg-zinc-900"
              >
                <h2 className="text-2xl font-semibold">
                  {project.name}
                </h2>

                <p className="text-zinc-400 mt-2">
                  {project.description}
                </p>

                <p className="text-sm text-zinc-600 mt-4">
                  Created: {project.created_at}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}