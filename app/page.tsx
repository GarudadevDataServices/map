"use client";

import dynamic from "next/dynamic";

const Mapp = dynamic(() => import("./map"), {
  loading: () => <p>loading...</p>,
  ssr: false
})

export default function page() {
  return <Mapp/>
}