"use client"; // ???????????????????????????
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

async function logout(router: AppRouterInstance) {
  const response = await fetch("http://localhost:3000/auth/signout", {
    credentials: "include",
    method: "GET",
  });
  const res = await response.json();
  if (response.ok) {
    router.push("/auth/login");
  } else alert("FAILED TO SIGN OUT");
}

export default function ProfilePage() {
  const router = useRouter();
  return (
    <>
      <div className="flex flex-col	items-center justify-center	 my-10">
        <h1 className="text-5xl pb-10 "> Welcome To The Game </h1>
        <button
          className="block bg-zinc-200 px-6 py-3 rounded-lg"
          onClick={() => {
            logout(router);
          }}
        >
          LOGOUT
        </button>
      </div>
    </>
  );
}
