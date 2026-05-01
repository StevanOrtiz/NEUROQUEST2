import { Swords, GraduationCap, Code2 } from "lucide-react"
import Link from "next/link"

const team = [
  {
    initials: "S",
    name: "Stevan Ortiz",
    role: "Project Manager / Main Developer",
    color: "bg-primary text-primary-foreground",
    bio: `De 19 años, estudiante de Desarrollo de Software en Lumen Gentium – UNICATÓLICA. Inició su camino en la programación desde los 14 años. Actualmente lidera su propio estudio independiente, WARE, donde se desempeña como Modelador 3D, Environment Artist y Competitive Layout Designer.

Diagnosticado desde la infancia con TDAH, Stevan vivió de primera mano los desafíos que enfrentan las personas neurodivergentes en el sistema educativo. Creó QuestMind como herramienta personal y colectiva para facilitar el enfoque, la constancia y el cumplimiento de metas educativas.`,
  },
  {
    initials: "J",
    name: "Juan Sebastian Molina",
    role: "Desarrollador",
    color: "bg-rpg-gold text-[oklch(0.13_0.02_280)]",
    bio: `Estudiante de Tecnología en Desarrollo de Software en la Fundación Universitaria Lumen Gentium, Cali. Se distingue por su interés en afrontar desafíos que fortalezcan sus habilidades tecnológicas.

Ha desarrollado prototipos funcionales de páginas web, incluyendo recreaciones de plataformas existentes y diseños propios. Destaca por su habilidad para el trabajo en equipo y su disposición para proyectos dinámicos con aprendizaje continuo.`,
  },
  {
    initials: "J",
    name: "Johan Balcazar",
    role: "Desarrollador",
    color: "bg-rpg-mana text-white",
    bio: `Estudiante de Tecnología en Desarrollo de Software en Lumen Gentium – UNICATÓLICA. Comenzó su camino en la programación a los 17 años, con interés en múltiples lenguajes y en el aprendizaje constante a través de nuevos proyectos.

Participó en este proyecto universitario para desarrollar una herramienta para personas con TDAH; cada avance le ha traído nuevos conocimientos tanto técnicos como sobre el tema de la neurodivergencia.`,
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm font-mono">Q</span>
          </div>
          <span className="font-bold text-lg text-foreground">QuestMind</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Iniciar sesion
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Registrarse
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ir al dashboard
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 py-16 text-center border-b border-border/50">
        <div className="max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Swords className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Sobre <span className="text-primary">QuestMind</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Un proyecto universitario nacido desde la experiencia personal, construido para transformar
            el aprendizaje de personas neurodivergentes en una aventura significativa.
          </p>
        </div>
      </section>

      {/* ── University ── */}
      <section className="px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <GraduationCap className="w-5 h-5 text-rpg-gold" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Institución
            </h2>
          </div>

          <div className="rounded-xl border border-rpg-gold/20 bg-card p-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-rpg-gold/10 border border-rpg-gold/30 flex items-center justify-center shrink-0">
                <GraduationCap className="w-7 h-7 text-rpg-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  UNICATÓLICA — Lumen Gentium
                </h3>
                <p className="text-sm text-rpg-gold font-mono mb-3">
                  Fundación Universitaria Católica Lumen Gentium · Cali, Colombia
                </p>
                <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Lumen Gentium – UNICATÓLICA es una institución educativa comprometida con la formación integral
                    de sus estudiantes, promoviendo el desarrollo académico, humano y ético dentro de un entorno
                    basado en valores.
                  </p>
                  <p>
                    Impulsa el aprendizaje a través de metodologías que combinan teoría y práctica, fomentando
                    el pensamiento crítico, la creatividad y la innovación, con una formación orientada a la
                    responsabilidad social.
                  </p>
                  <p>
                    En este entorno, los estudiantes encuentran un espacio para crecer, explorar sus capacidades
                    y construir proyectos con propósito, apoyados por una comunidad académica que valora el
                    esfuerzo, la disciplina y la evolución constante.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="px-6 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Equipo de Desarrollo
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-border/50 bg-card p-6 hover:border-border transition-colors"
              >
                <div className="flex items-start gap-5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${member.color}`}>
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{member.role}</p>
                    <div className="space-y-2">
                      {member.bio.split("\n\n").map((paragraph, i) => (
                        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 border-t border-border/50 text-center mt-auto">
        <p className="text-sm text-muted-foreground">
          QuestMind - Aprende jugando. Hecho para estudiantes con TDAH.
        </p>
      </footer>
    </main>
  )
}
