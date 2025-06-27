"use client"

import {  Search } from "lucide-react";
import { McpTagList } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { ICONS } from "@/components/icons";

export function McpSearchBox() {
  return (
    <section className="flex flex-col gap-6">
      hello
      <div className="h-12 w-full"></div>
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-medium text-primary-800">
          Search across 1000+ MCPs
        </h2>
        <p className="text-sm text-primary-300">
          Want to write an email, Need Notion Personal Assistant? Search your
          queries
        </p>
      </div>
      <div className="flex flex-col gap-3 p-4 rounded-[18px] bg-primary-25 max-w-[720px] mx-auto w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)] shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)]">
        <div className="relative">
          <textarea
            placeholder="I want to Send my boss emails"
            className="bg-primary-00 w-full border-none p-4 h-[84px] text-primary-700 placeholder:text-primary-300 resize-none rounded-[12px] border  focus:outline-none focus:ring-0"
          />
          <Button className="absolute right-4 top-1/2 -translate-y-1/2">
            <span>Search</span>
            <Search />
          </Button>
        </div>
        <div className="flex justify-between">
          <McpTagList
            className="bg-white text-primary-300"
            tags={[
              {
                tag: "Assistant",
              },
              {
                tag: "Free",
              },
            ]}
          />
          <div className="flex p-0">
            <UploadFile />
            <RetrieveMcp />
          </div>
        </div>
      </div>
    </section>
  );
}

export function UploadFile() {
  return (
    <Button
      className="hover:text-primary-700 cursor-pointer"
      variant={"ghost"}
      size={"icon"}
    >
      <ICONS.uploadIcon />
    </Button>
  );
}

export function RetrieveMcp() {
  return (
    <Button
      className="hover:text-primary-700 cursor-pointer"
      variant={"ghost"}
      size={"icon"}
    >
      <ICONS.retryIcon className="" />
    </Button>
  );
}