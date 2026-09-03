"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { faqs, products as fallbackProducts } from "../data/catalog";
import type { StoreProduct } from "../lib/printify";
import type { SiteContent } from "../lib/site-content";
import { SiteFooter } from "../components/SiteChrome";

type CartItem = { id: string; name: string; price: number; meta: string; qty: number };

const fallbackContent: SiteContent = {
  announcement: { title:"ONE-OF-ONE PIECES. MADE DIFFERENT.", subtitle:"READY TO WEAR • UPCYCLED • HAND FINISHED", body:"NEW DROPS AVAILABLE" },
  hero: { title:"YOU WEAR CLOTHES. WE MAKE PIECES.", subtitle:"PRE-MADE • CREATIVE • ONE-OF-A-KIND", body:"Ready-to-wear denim, upcycled streetwear, and one-of-one pieces from Vivlox." },
  about: { title:"NOT MASS PRODUCED. MADE DIFFERENT.", subtitle:"ABOUT VIVLOX", body:"Vivlox creates limited-run clothing and one-of-one pieces with bold silhouettes and hand-finished details." },
  newsletter: { title:"DON’T MISS THE NEXT DROP.", subtitle:"DROP ALERTS", body:"One-of-one doesn’t restock." },
};

export default function Storefront({ initialProducts = fallbackProducts.map((product)=>({ ...product, source:"demo" as const })), content = fallbackContent }: { initialProducts?: StoreProduct[]; content?: SiteContent }) {
  const products = initialProducts;
  const announcementRef = useRef<HTMLElement>(null);
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quick, setQuick] = useState<StoreProduct | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<string[]>(["Welcome to Vivlox. Need help finding a drop, size, or ready-to-wear piece?"]);
  const [before, setBefore] = useState(48);
  const subtotal = useMemo(() => cart.reduce((n, item) => n + item.price * item.qty, 0), [cart]);

  useEffect(() => {
    const announcement = announcementRef.current;
    if (!announcement) return;

    let isInView = true;
    const syncAnimation = () => setAnnouncementActive(isInView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      syncAnimation();
    });

    observer.observe(announcement);
    document.addEventListener("visibilitychange", syncAnimation);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncAnimation);
    };
  }, []);

  function addItem(item: CartItem) {
    setCart((current) => {
      const found = current.find((x) => x.id === item.id && x.meta === item.meta);
      return found ? current.map((x) => x === found ? { ...x, qty: x.qty + 1 } : x) : [...current, item];
    });
    setQuick(null);
    setCartOpen(true);
  }

  async function checkout() {
    const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart }) });
    const result = await response.json() as { url?: string; error?: string };
    if (result.url) window.location.href = result.url;
    else alert(result.error || "Checkout will be available as soon as Stripe is connected.");
  }

  function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form).get("message")?.toString().trim();
    if (!input) return;
    const lower = input.toLowerCase();
    let answer = "Tell me the style, size, or piece you’re looking for and I’ll point you toward the right Vivlox drop.";
    if (lower.includes("flare")) answer = "The After Hours Flare is a ready-to-wear one-of-one piece in size 34.";
    if (lower.includes("size 34")) answer = "The Question Mark Denim is currently listed in 34, and the After Hours Flare is a one-of-one size 34.";
    if (lower.includes("shipping")) answer = "Ready-made orders ship after checkout. Tracking appears in your order dashboard as soon as the piece is on the way.";
    setChat((messages) => [...messages, `You: ${input}`, answer]);
    form.reset();
  }

  return (
    <main>
      <aside className="announce" ref={announcementRef} aria-label="Store announcements">
        <div className={`announce-track ${announcementActive ? "is-running" : ""}`}>
          <div className="announce-group">
            <span>{content.announcement.title}</span><span>{content.announcement.subtitle}</span><span>{content.announcement.body}</span>
          </div>
          <div className="announce-group" aria-hidden="true">
            <span>{content.announcement.title}</span><span>{content.announcement.subtitle}</span><span>{content.announcement.body}</span>
          </div>
        </div>
      </aside>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Vivlox home"><Image src="/brand/hero-v-logo.png" alt="Vivlox" width={92} height={92} priority /></a>
        <nav aria-label="Primary navigation"><a href="#shop">Shop</a><a href="#drops">New drops</a><a href="#one-of-one">One-of-ones</a><a href="#sewcial">Community</a><a href="#newsletter">Drop alerts</a></nav>
        <div className="header-actions"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">MENU</button><button aria-label="Search">⌕</button><button onClick={() => setCartOpen(true)} aria-label="Open shopping bag">Bag <b>{cart.reduce((n,x)=>n+x.qty,0)}</b></button></div>
        {menuOpen && <div className="mobile-nav"><a href="#shop">SHOP</a><a href="#drops">NEW DROPS</a><a href="#one-of-one">ONE-OF-ONES</a><a href="#sewcial">COMMUNITY</a></div>}
      </header>

      <section className="hero" id="top">
        <Image className="hero-watermark" src="/brand/hero-v-logo.png" alt="" width={1280} height={1280} priority />
        <div className="hero-copy"><p className="eyebrow">{content.hero.subtitle}</p><h1>{content.hero.title}</h1><p className="intro">{content.hero.body}</p><div className="hero-buttons"><a className="button button-light" href="#drops">Shop the drop</a><a className="button button-outline" href="#shop">Shop all pieces</a></div></div>
        <div className="hero-foot"><span>↓ SCROLL TO DISCOVER</span><span>SHOP IT. WEAR IT. MAKE IT YOURS.</span></div>
      </section>

      <section className="section paper" id="drops"><div className="section-head"><div><p className="kicker">FRESH OUT THE SEWING ROOM</p><h2>NEW DROPS</h2></div><a href="#shop">SHOP ALL ↗</a></div><div className="product-grid">{products.map((product) => <article className={`product-card ${product.tone}`} key={product.id}><button className="heart" aria-label={`Save ${product.name}`}>♡</button>{product.badge && <span className="badge">{product.badge}</span>}<button className="product-art" onClick={() => setQuick(product)} aria-label={`Quick view ${product.name}`}>{product.image ? <Image src={product.image} alt={product.name} fill sizes="(max-width: 900px) 50vw, 25vw" unoptimized /> : <span>{product.art}</span>}</button><div className="product-meta"><div><p>{product.category}</p><h3><a href={`/products/${product.id}`}>{product.name}</a></h3></div><strong>${product.price}</strong></div><div className="product-quick"><a href={`/products/${product.id}`}>VIEW PRODUCT</a><button onClick={() => addItem({ id:product.id,name:product.name,price:product.price,meta:`Size ${product.sizes[0]}`,qty:1 })}>ADD TO BAG</button></div></article>)}</div></section>

      <section className="one-section" id="one-of-one"><div className="one-copy"><p className="kicker acid">ONE OWNER. ONE TIME.</p><h2>THERE’S<br />ONLY ONE.</h2><p>One piece. One owner. Once it’s gone, it’s gone.</p><button className="button button-light" onClick={() => setQuick(products[1])}>SHOP ONE-OF-ONES</button></div><div className="one-art"><span className="giant-mark">✦</span><div className="one-label">AFTER HOURS FLARE<br /><b>1 / 1</b></div></div></section>

      <section className="before-after section"><div className="section-head inverse"><div><p className="kicker acid">THE VIVLOX EFFECT</p><h2>FROM REGULAR TO<br />ONE-OF-ONE.</h2></div></div><div className="comparison"><div className="compare-panel before"><span>EVERYDAY DENIM</span><div className="pants">II</div></div><div className="compare-panel after" style={{clipPath:`inset(0 0 0 ${before}%)`}}><span>VIVLOX ORIGINAL</span><div className="pants">??</div></div><input aria-label="Style comparison" type="range" min="5" max="95" value={before} onChange={(e)=>setBefore(Number(e.target.value))} /><div className="compare-line" style={{left:`${before}%`}}><b>↔</b></div></div></section>

      <section className="about-split"><div className="about-copy"><p className="kicker acid">{content.about.subtitle}</p><h2>{content.about.title}</h2><p>{content.about.body}</p><a className="text-link" href="#drops">SHOP THE LATEST DROP →</a></div><div className="studio-note"><span>LIMITED RUNS</span><b>WEAR<br />DIFFERENT.</b><span>MADE TO STAND OUT</span></div></section>

      <section className="sewcial section" id="sewcial"><div className="sewcial-art"><Image src="/brand/hero-v-logo.png" alt="Vivlox community emblem" fill sizes="(max-width: 800px) 100vw, 42vw" /></div><div className="sewcial-copy"><p className="kicker acid">A COMMUNITY BUILT ON STYLE, CREATIVITY & SELF-EXPRESSION</p><h2>WELCOME TO<br />THE VIVLOX<br /><em>COMMUNITY.</em></h2><p>Fresh drops, styling inspiration, and a front-row look at what’s coming next.</p><ul><li>Discover new releases</li><li>Style limited pieces</li><li>Connect with other creatives</li><li>Get early drop alerts</li></ul><div className="hero-buttons"><a className="button button-light" href="#newsletter">Join the community</a><a className="button button-outline" href="#drops">Shop new drops</a></div></div></section>

      <section className="faq section"><div className="section-head inverse"><div><p className="kicker acid">NEED TO KNOW</p><h2>FAQ / THE DETAILS</h2></div></div><div className="faq-list">{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>

      <section className="reviews section paper"><p className="kicker">WORD ON THE STREET</p><div className="review-grid"><blockquote>“The fit is perfect and the details make it feel unlike anything else in my closet.”<footer>★★★★★ — MARCUS / ATLANTA</footer></blockquote><blockquote>“Vivlox made the whole look feel effortless. The piece gets noticed every time I wear it.”<footer>★★★★★ — NIA / BALTIMORE</footer></blockquote></div></section>

      <section className="newsletter" id="newsletter"><div><p className="kicker acid">{content.newsletter.subtitle}</p><h2>{content.newsletter.title}</h2><p>{content.newsletter.body}</p></div><form action="/api/newsletter" method="post"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" required placeholder="YOUR EMAIL ADDRESS" /><button type="submit">KEEP ME POSTED →</button></form></section>

      <SiteFooter />

      {quick && <div className="modal-backdrop" onClick={()=>setQuick(null)}><section className="quick-modal" onClick={(e)=>e.stopPropagation()}><button className="close" onClick={()=>setQuick(null)}>×</button><div className={`quick-art ${quick.tone}`}>{quick.art}</div><div><p className="kicker">{quick.category}</p><h2>{quick.name}</h2><strong className="quick-price">${quick.price}</strong><p>{quick.description}</p><label>SIZE<select id="quick-size">{quick.sizes.map(size=><option key={size}>{size}</option>)}</select></label><button className="button dark-button" onClick={()=>addItem({id:quick.id,name:quick.name,price:quick.price,meta:`Size ${quick.sizes[0]}`,qty:1})}>ADD TO BAG →</button></div></section></div>}

      <aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}><div className="cart-head"><h2>YOUR BAG / {cart.reduce((n,x)=>n+x.qty,0)}</h2><button onClick={()=>setCartOpen(false)}>×</button></div><div className="cart-items">{cart.length===0?<p>Your bag is waiting for something different.</p>:cart.map((item,index)=><div className="cart-item" key={`${item.id}-${index}`}><div className="cart-thumb">✂</div><div><h3>{item.name}</h3><p>{item.meta}</p><button onClick={()=>setCart(cart.filter((_,i)=>i!==index))}>REMOVE</button></div><strong>${item.price*item.qty}</strong></div>)}</div><div className="cart-foot"><div><span>SUBTOTAL</span><strong>${subtotal}</strong></div><p>Ready-made pieces ship while stock lasts.</p><button disabled={!cart.length} onClick={checkout}>SECURE CHECKOUT →</button></div></aside>{cartOpen && <button className="drawer-scrim" onClick={()=>setCartOpen(false)} aria-label="Close cart" />}

      <button className="sewit-pin" onClick={()=>setChatOpen(!chatOpen)} aria-label="Open SewIT chat"><span>• •</span></button>{!chatOpen && <div className="pin-bubble">Need help? Pin me.</div>}
      {chatOpen && <section className="chat-panel"><header><div className="mini-pin">••</div><div><b>SEWIT</b><span>VIVLOX ASSISTANT</span></div><button onClick={()=>setChatOpen(false)}>×</button></header><div className="chat-messages">{chat.map((message,i)=><p className={message.startsWith("You:")?"user-message":"bot-message"} key={`${message}-${i}`}>{message}</p>)}</div><div className="chat-chips"><button onClick={()=>setChat([...chat,"The After Hours Flare is a ready-to-wear one-of-one piece in size 34."])}>FLARES?</button><button onClick={()=>setChat([...chat,"New ready-made pieces land in limited drops. Join drop alerts so you don’t miss the next release."])}>NEXT DROP?</button></div><form onSubmit={sendChat}><input name="message" aria-label="Message SewIT" placeholder="Ask SewIT…" /><button>↑</button></form></section>}
    </main>
  );
}
