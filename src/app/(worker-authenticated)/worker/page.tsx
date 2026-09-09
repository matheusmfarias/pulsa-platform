import { getWorkerHome, WorkerHomeContent } from "@/modules/worker-schedule";

export default async function WorkerHomePage() {
  const home = await getWorkerHome();
  return <WorkerHomeContent home={home} />;
}
