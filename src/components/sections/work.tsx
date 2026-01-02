import { ProjectCard } from "@/components/project-card";
import { projects } from "@/lib/data";

export function Work() {
  return (
    <section id="work" className="container mx-auto py-16">
      <h2 className="text-center font-headline text-3xl md:text-4xl font-bold mb-12">
        Featured Projects
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </section>
  );
}
