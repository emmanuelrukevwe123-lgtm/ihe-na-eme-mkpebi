const GITHUB_URL = "https://github.com/emmanuelrukevwe123-lgtm";

export default function Footer({ note }) {
  return (
    <footer className="footer">
      {note && <p>{note}</p>}
      <p>
        A fun side project by{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          emmanuelrukevwe123-lgtm on GitHub ↗
        </a>
      </p>
    </footer>
  );
}
