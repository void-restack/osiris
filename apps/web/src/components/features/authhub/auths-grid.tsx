import { BadgeCheck } from "lucide-react";
import { AuthMethodDialog } from "./auth-method-dialog";
import type { ServiceClient } from "@/types/auth";
import { Link } from "@tanstack/react-router";
// import { formatDistanceToNow } from "date-fns";

interface AuthGridViewProps {
  methods: ServiceClient[];
}

export function AuthGridView({ methods }: AuthGridViewProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {methods.map((method: ServiceClient) => (
        <div
          // to={`/auth/${method.clientId}`}
          key={method.clientId}
          className="group h-fit min-h-52 rounded-xl border border-primary-100 p-6 transition-all hover:border-primary-200 hover:shadow-md"
        >
          {/* Header */}
          <div className="mb-4 flex w-full items-start justify-between">
            <div className="flex flex-col items-start gap-3">
              <div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                {method.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h4 className="font-medium text-primary-800 capitalize flex items-center gap-1">
                  {method.name}
                  <BadgeCheck className="size-4 stroke-white fill-green-500" />
                </h4>
                <p className="text-[13px] text-primary-300">{Object.keys(method.scopeDefinitions).length} Scopes</p>
                {/* <Badge variant="outline" className="w-fit text-xs capitalize"> */}
                {/*   {method.type.replace('_', ' ')} */}
                {/* </Badge> */}
              </div>
            </div>
            <AuthMethodDialog method={method} />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <p className="text-primary-300 text-sm line-clamp-2 leading-relaxed">
              {method.description}
            </p>

            {/* Stats */}
            {/* <div className="flex items-center justify-between text-xs text-primary-400"> */}
            {/*   <div className="flex items-center gap-4"> */}
            {/*     <span className="flex items-center gap-1"> */}
            {/*       <Settings className="size-3" /> */}
            {/*       {Object.keys(method.scopeDefinitions).length} scopes */}
            {/*     </span> */}
            {/*     <span className="flex items-center gap-1"> */}
            {/*       <Clock className="size-3" /> */}
            {/*       {formatDistanceToNow(new Date(method.createdAt), { addSuffix: true })} */}
            {/*     </span> */}
            {/*   </div> */}
            {/* </div> */}

            {/* Services */}
            {/* {method.supportedServices.length > 0 && ( */}
            {/*   <div className="flex flex-wrap gap-1"> */}
            {/*     {method.supportedServices.slice(0, 3).map((service) => ( */}
            {/*       <Badge key={service} variant="secondary" className="text-xs py-0 px-2"> */}
            {/*         {service} */}
            {/*       </Badge> */}
            {/*     ))} */}
            {/*     {method.supportedServices.length > 3 && ( */}
            {/*       <Badge variant="secondary" className="text-xs py-0 px-2"> */}
            {/*         +{method.supportedServices.length - 3} */}
            {/*       </Badge> */}
            {/*     )} */}
            {/*   </div> */}
            {/* )} */}
          </div>
        </div>
      ))}
    </div>
  );
}
