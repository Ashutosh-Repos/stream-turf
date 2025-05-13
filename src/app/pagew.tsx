import { auth } from "../auth";
const Home = async () => {
  const session = await auth();

  if (!session?.user) return null;
  return (
    <div>
      <h1 className="text-4xl text-red-400">Vidora</h1>
      <p>{JSON.stringify(session.user)}</p>
    </div>
  );
};

export default Home;
