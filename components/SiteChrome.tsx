import Image from "next/image";

export function SiteHeader() {
  return <header className="site-header page-header"><a className="brand" href="/#top" aria-label="Vivlox home"><Image src="/brand/hero-v-logo.png" alt="Vivlox" width={92} height={92} priority /></a><nav aria-label="Primary navigation"><a href="/#shop">Shop</a><a href="/#drops">New drops</a><a href="/#one-of-one">One-of-ones</a><a href="/#sewcial">Community</a><a href="/#newsletter">Drop alerts</a></nav><div className="header-actions"><a href="/#shop">Shop now</a></div></header>;
}

export function SiteFooter() {
  return <footer className="footer"><div className="footer-brand"><Image src="/brand/hero-v-logo.png" alt="Vivlox" width={170} height={170} /><p>PRE-MADE. CREATIVE.<br />ONE-OF-A-KIND.</p></div>{[["SHOP","New Drops","One-of-Ones","Denim","All Products"],["HELP","FAQ","Shipping","Returns","Track Order"],["VIVLOX","About","Community","Drop Alerts","Instagram"],["LEGAL","Privacy","Terms","Accessibility"]].map(([title,...links])=><div key={title}><h3>{title}</h3>{links.map((label)=><a href={label === "Privacy" ? "/privacy" : label === "Terms" ? "/terms" : "/#shop"} key={label}>{label}</a>)}</div>)}<div className="footer-bottom">© 2026 VIVLOX. ALL RIGHTS RESERVED. <span>BUILT WITH THREAD. WORN WITH ATTITUDE.</span></div></footer>;
}
