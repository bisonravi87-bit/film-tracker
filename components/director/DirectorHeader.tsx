import Image from "next/image";
import type { Director } from "@/lib/types";

export default function DirectorHeader({ director }: { director: Director }) {
  return (
    <header className="flex items-center gap-5">
      {director.profile_path && (
        <Image src={`https://image.tmdb.org/t/p/w185${director.profile_path}`} alt="" width={96} height={96}
          className="h-24 w-24 rounded-full object-cover" />
      )}
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{director.name}</h1>
        {director.biography && <p className="mt-1 line-clamp-2 max-w-prose text-sm text-slate2">{director.biography}</p>}
      </div>
    </header>
  );
}
