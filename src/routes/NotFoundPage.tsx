import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section>
      <h1 className="font-heading text-2xl font-bold">Siden finnes ikke</h1>
      <p className="text-text-muted mt-2">
        Fant ikke siden du lette etter.{" "}
        <Link
          to="/"
          className="text-brand-magenta underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Gå til forsiden
        </Link>
        .
      </p>
    </section>
  );
}
