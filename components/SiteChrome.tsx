import Image from "next/image";

export function SiteHeader({ onLight = false }: { onLight?: boolean }) {
  return <header className={`site-header page-header${onLight ? " header-on-light" : ""}`}><a className="brand" href="/#top" aria-label="Vivlox home"><Image src="/brand/vivlox-wordmark.png" alt="Vivlox — Define Your Essence" width={360} height={120} priority /></a><nav aria-label="Primary navigation"><a href="/#shop">Shop</a><a href="/#drops">New drops</a><a href="/#shop">Collections</a><a href="/#sewcial">Community</a><a href="/#newsletter">Drop alerts</a></nav><div className="header-actions"><a href="/#shop">Shop now</a></div></header>;
}

export function SiteFooter() {
  return <footer className="footer"><div className="footer-brand"><Image src="/brand/vivlox-wordmark.png" alt="Vivlox — Define Your Essence" width={430} height={144} /><p>PRE-MADE. CREATIVE.<br />READY TO WEAR.</p></div>{[["SHOP","New Drops","Collections","Denim","All Products"],["HELP","FAQ","Shipping","Returns","Track Order"],["VIVLOX","About","Community","Drop Alerts","Instagram"],["LEGAL","Privacy","Terms","Accessibility"]].map(([title,...links])=><div key={title}><h3>{title}</h3>{links.map((label)=><a href={label === "Privacy" ? "/privacy" : label === "Terms" ? "/terms" : "/#shop"} key={label}>{label}</a>)}</div>)}<div className="footer-bottom">© 2026 VIVLOX. ALL RIGHTS RESERVED. <span>BUILT WITH THREAD. WORN WITH ATTITUDE.</span></div></footer>;
}
