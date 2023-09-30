"use client"; // ???????????????????????????
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex flex-col	items-center justify-center	 my-10">
        <h1 className="text-5xl pb-10 "> HOME PAGE </h1>
        <Link href={"/auth/login"}>
          <button className="block bg-zinc-200 px-6 py-3 rounded-lg">
            {"LET'S GO 🔥"}
          </button>
        </Link>
      </div>
    </>
  );
}
