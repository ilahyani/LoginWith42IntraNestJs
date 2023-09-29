"use client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import Link from "next/link";

async function login(
  username: string,
  password: string,
  router: AppRouterInstance
) {
  const response = await fetch("http://localhost:3000/auth/signin", {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
  if (response.ok) {
    const res = await response.json();
    router.push("/profile");
  } else {
    alert("Failed To Signin");
  }
}

export default function LoginPage() {
  let username: string, passwd: string;
  const router = useRouter();
  function handleClick(e: any) {
    e.preventDefault();
    login(username, passwd, router);
  }
  return (
    <>
      <div className="flex flex-col	items-center justify-center	 my-10">
        <h1 className="text-5xl pb-10 ">WELCOME TO PONG CLUB</h1>
        <div>
          <form onSubmit={handleClick}>
            <input
              className="block border-2 border-gray-200 px-4 py-2 mb-2 rounded-lg"
              type="text"
              placeholder="username"
              onChange={(e) => {
                username = e.target.value;
              }}
            ></input>
            <input
              className="block border-2 border-gray-200 px-4 py-2 mb-2 rounded-lg"
              type="password"
              placeholder="password"
              onChange={(e) => {
                passwd = e.target.value;
              }}
            ></input>
            <button
              type="submit"
              className="block bg-zinc-200 px-6 py-3 mb-4 rounded-lg w-full"
            >
              Sign in
            </button>
          </form>
          <Link href="http://localhost:3000/auth/42">
            <button className="block bg-zinc-200 px-6 py-3 mb-4 rounded-lg w-full">
              Continue with intra
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
