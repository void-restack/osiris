export type UnitsCardProps = {
	title: string;
	description: string;
	oneLiner: string;
};

export function UnitsCard() {
	return (
		<div className="relative h-[200px] border bg-primary-600">
			{/* <p className="text-primary-300 text-xs line-clamp-5">
        Store and retrieve user-specific memories to maintain context and make
        informed decisions based on past interactions Store and retrieve
        user-specific memories to maintain context and make informed decisions
        based on past interactions
      </p> */}
			<div className="absolute inset-0 h-full w-full">
				<img
					src="/union.png"
					className="h-full w-full bg-primary-00 object-fill"
				/>
			</div>
			{/* <h1 className="line-clamp-1 relative z-10">
          Store and retrive user specific memoriess
        </h1>
        <div className="relative z-10">
          <p className="line-clamp-1">Transcript of meeting.doc</p>
          <Link className="stroke-primary-300 size-2.5" />
        </div> */}
		</div>
	);
}
