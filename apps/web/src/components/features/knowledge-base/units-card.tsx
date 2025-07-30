import { Link } from "lucide-react";

export type UnitsCardProps = {
  title: string;
  description: string;
  oneLiner: string;
};

export function UnitsCard() {
  return (
    <div className="relative h-[200px] border-2 border-[#F5F5F5] rounded-[12px]">
      <p className="text-primary-300 text-xs line-clamp-5 px-2.5 py-4">
        Store and retrieve user-specific memories to maintain context and make
        informed decisions based on past interactions Store and retrieve
        user-specific memories to maintain context and make informed decisions
        based on past interactions
      </p>
      <div className="absolute h-[113px] w-full  bottom-0 flex flex-col justify-between overflow-hidden">
        <img src="/union.svg" alt="" className=" absolute w-full inset-0 w-fit" />
        <h1 className="line-clamp-1 relative z-10 px-4 py-1 h-full flex items-center mt-5 text-sm ">
          Store and retrive user specific
        </h1>
        <div className="relative z-10 flex items-center justify-between py-2.5 px-[14px] border-t border-t-primary-100">
          <p className="line-clamp-1 text-primary-400 text-xs">Transcript of meeting.doc</p>
          <Link className="stroke-primary-300 size-3" />
        </div>
     </div>
    </div>
  );
}
