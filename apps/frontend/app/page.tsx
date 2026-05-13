async function getBackendMessage() {
  try {
    const res = await fetch("http://backend:8000/api/hello/", {
      cache: "no-store",
    });

    return res.json();
  } catch (error) {
    return {
      message: "Backend unavailable",
    };
  }
}

export default async function Home() {
  const data = await getBackendMessage();

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          AI Workspace Platform
        </h1>

        <p className="text-lg">
          {data.message}
        </p>
      </div>
    </main>
  );
}