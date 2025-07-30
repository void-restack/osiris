import { KnowledgeBaseCard } from "./knowledge-base-card";

export type KnowledgeBaseCardProps = {
  id: string;
  title: string;
  description: string;
  banner: string;
  link: string;
  logo: string;
  createdAt: string; // ISO date string
  tags: string[];
  isVerified: boolean;
  stars: number;
  credits: number;
  permission: "public" | "private";
};

export const mockKnowledgeBaseData: KnowledgeBaseCardProps[] = [
  {
    id: "1",
    description: "Customer feedback data knowledge system ",
    title: "Browser Hub",
    banner: "/test/k.banner.svg",
    link: "/test/k.link",
    logo: "/test/k.logo.svg",
    createdAt: "2024-06-01T10:00:00Z",
    tags: ["AI", "Feedback"],
    isVerified: true,
    stars: 4.5,
    credits: 0,
    permission: "public",
  },
  {
    id: "2",
    description: "Internal documentation knowledge base.",
    title: "Docs Hub",
    banner: "/test/k.banner.svg",
    link: "/test/k.link",
    logo: "/test/k.logo.svg",
    createdAt: "2024-05-15T12:00:00Z",
    tags: ["Docs", "Internal"],
    isVerified: false,
    stars: 4.2,
    credits: 100,
    permission: "private",
  },
  {
    id: "3",
    description: "Sales enablement knowledge system.",
    title: "Sales Hub",
    banner: "/test/k.banner.svg",
    link: "/test/k.link",
    logo: "/test/k.logo.svg",
    createdAt: "2024-04-20T09:00:00Z",
    tags: ["Sales", "Enablement"],
    isVerified: true,
    stars: 4.8,
    credits: 50,
    permission: "public",
  },
  {
    id: "4",
    description: "Support knowledge base for customers.",
    title: "Support Hub",
    banner: "/test/k.banner.svg",
    link: "/test/k.link",
    logo: "/test/k.logo.svg",
    createdAt: "2024-03-10T08:00:00Z",
    tags: ["Support", "Customer"],
    isVerified: false,
    stars: 4.0,
    credits: 0,
    permission: "public",
  },
  {
    id: "5",
    description: "Engineering knowledge base.",
    title: "Engineering Hub",
    banner: "/test/k.banner.svg",
    link: "/test/k.link",
    logo: "/test/k.logo.svg",
    createdAt: "2024-02-01T11:00:00Z",
    tags: ["Engineering", "Tech"],
    isVerified: true,
    stars: 4.9,
    credits: 200,
    permission: "private",
  },
  {
    id: "6",
    description: "Marketing knowledge base.",
    title: "Marketing Hub",
    banner: "/test/k.banner.svg",
    link: "/test/k.link",
    logo: "/test/k.logo.svg",
    createdAt: "2024-01-15T14:00:00Z",
    tags: ["Marketing", "Campaigns"],
    isVerified: false,
    stars: 3.8,
    credits: 0,
    permission: "public",
  },
];

export function BrowseKnowledgeBaseList({ cards }: { cards: KnowledgeBaseCardProps[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <KnowledgeBaseCard key={card.id} {...card} />
      ))}
    </div>
  );
}
