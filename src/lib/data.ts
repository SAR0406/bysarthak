export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
] as const;

export const skills = [
  { name: "React", level: 95 },
  { name: "Next.js", level: 90 },
  { name: "TypeScript", level: 90 },
  { name: "JavaScript", level: 95 },
  { name: "Node.js", level: 85 },
  { name: "Tailwind CSS", level: 98 },
  { name: "Figma", level: 80 },
  { name: "Firebase", level: 75 },
] as const;

export const projects = [
  {
    id: 1,
    title: "E-commerce Platform",
    description: "A full-stack e-commerce solution with a modern UI, product management, and payment integration.",
    tags: ["Next.js", "React", "Stripe", "Tailwind CSS"],
    image: "/placeholder-images.json/projects/1",
  },
  {
    id: 2,
    title: "Project Management Tool",
    description: "A collaborative tool for teams to manage tasks, track progress, and communicate effectively.",
    tags: ["React", "Firebase", "Zustand", "dnd-kit"],
    image: "/placeholder-images.json/projects/2",
  },
  {
    id: 3,
    title: "Personal Blog",
    description: "A content-focused blog platform built with a headless CMS for easy article management.",
    tags: ["Gatsby", "GraphQL", "Contentful", "Styled Components"],
    image: "/placeholder-images.json/projects/3",
  },
  {
    id: 4,
    title: "Data Visualization Dashboard",
    description: "An interactive dashboard for visualizing complex datasets with various chart types.",
    tags: ["React", "D3.js", "Redux", "Sass"],
    image: "/placeholder-images.json/projects/4",
  },
];
