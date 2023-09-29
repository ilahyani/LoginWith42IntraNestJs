import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

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

export default function SigninForm() {
  let username: string, passwd: string;
  const router = useRouter();
  function handleClick(e: any) {
    e.preventDefault();
    login(username, passwd, router);
  }
  return (
    <>
      <form onSubmit={handleClick}>
        <input
          required
          className="block border-2 border-gray-200 px-4 py-2 mb-2 rounded-lg"
          type="text"
          placeholder="username"
          onChange={(e) => {
            username = e.target.value;
          }}
        ></input>
        <input
          required
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
    </>
  );
}
