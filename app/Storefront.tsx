"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { customPackages, faqs, products, type Product } from "../data/catalog";

type CartItem = { id: string; name: string; price: number; meta: string; qty: number };

export default function Storefront() {
  const announcementRef = useRef<HTMLElement>(null);
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<string[]>(["Yo. I’m SewIT. Need help finding a piece or choosing a custom package?"]);
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

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector<HTMLElement>("[data-status]");
    const data = new FormData(form);
    const response = await fetch("/api/quotes", { method: "POST", body: data });
    if (response.ok) { form.reset(); if (status) status.textContent = "WE GOT YOU. Your custom request is in the sewing room inbox."; }
    else if (status) status.textContent = "We couldn’t send that yet. Try again in a moment.";
  }

  function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form).get("message")?.toString().trim();
    if (!input) return;
    const lower = input.toLowerCase();
    let answer = "Tell me what you want done—patches, flares, distressing, dye, or something completely custom—and I’ll point you in the right direction.";
    if (lower.includes("package 2") || lower.includes("flare")) answer = "Package 2 is Disoriented Flares: patchwork, flare conversion, and optional distressing. Base price is $195.";
    if (lower.includes("size 34")) answer = "The Question Mark Denim is currently listed in 34, and the After Hours Flare is a one-of-one size 34.";
    if (lower.includes("send") && lower.includes("jean")) answer = "Yep. Choose your package first, then we’ll send shipping instructions. Your jeans become the canvas.";
    setChat((messages) => [...messages, `You: ${input}`, answer]);
    form.reset();
  }

  return (
    <main>
      <aside className="announce" ref={announcementRef} aria-label="Store announcements">
        <div className={`announce-track ${announcementActive ? "is-running" : ""}`}>
          <div className="announce-group">
            <span>ONE-OF-ONE PIECES. MADE DIFFERENT.</span><span>CUSTOM DENIM • UPCYCLED • HAND FINISHED</span><span>CUSTOM ORDERS AVAILABLE</span>
          </div>
          <div className="announce-group" aria-hidden="true">
            <span>ONE-OF-ONE PIECES. MADE DIFFERENT.</span><span>CUSTOM DENIM • UPCYCLED • HAND FINISHED</span><span>CUSTOM ORDERS AVAILABLE</span>
          </div>
        </div>
      </aside>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="UrSewBro home"><Image src="/brand/ursewbro-logo.png" alt="UrSewBro" width={92} height={92} priority /></a>
        <nav aria-label="Primary navigation"><a href="#shop">Shop</a><a href="#custom">Custom</a><a href="#drops">New drops</a><a href="#one-of-one">One-of-ones</a><a href="#lookbook">Lookbook</a><a href="#sewcial">Sewcial club</a></nav>
        <div className="header-actions"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">MENU</button><button aria-label="Search">⌕</button><button onClick={() => setCartOpen(true)} aria-label="Open shopping bag">Bag <b>{cart.reduce((n,x)=>n+x.qty,0)}</b></button></div>
        {menuOpen && <div className="mobile-nav"><a href="#shop">SHOP</a><a href="#custom">CUSTOM</a><a href="#lookbook">LOOKBOOK</a><a href="#sewcial">SEWCIAL CLUB</a></div>}
      </header>

      <section className="hero" id="top">
        <Image className="hero-watermark" src="/brand/ursewbro-logo.png" alt="" width={1184} height={1184} priority />
        <div className="hero-copy"><p className="eyebrow">CUSTOM • CREATIVE • ONE-OF-A-KIND</p><h1>YOU WEAR<br />CLOTHES.<br /><em>WE MAKE PIECES.</em></h1><p className="intro">Custom denim. Upcycled streetwear. One-of-one pieces built by UrSewBro.</p><div className="hero-buttons"><a className="button button-light" href="#drops">Shop the drop</a><a className="button button-outline" href="#custom">Start a custom piece</a></div></div>
        <div className="hero-foot"><span>↓ SCROLL TO DISCOVER</span><span>SHOP IT. SEND IT. MAKE IT YOURS.</span></div>
      </section>

      <section className="section paper" id="drops"><div className="section-head"><div><p className="kicker">FRESH OUT THE SEWING ROOM</p><h2>NEW DROPS</h2></div><a href="#shop">SHOP ALL ↗</a></div><div className="product-grid">{products.map((product) => <article className={`product-card ${product.tone}`} key={product.id}><button className="heart" aria-label={`Save ${product.name}`}>♡</button>{product.badge && <span className="badge">{product.badge}</span>}<button className="product-art" onClick={() => setQuick(product)} aria-label={`Quick view ${product.name}`}><span>{product.art}</span></button><div className="product-meta"><div><p>{product.category}</p><h3>{product.name}</h3></div><strong>${product.price}</strong></div><div className="product-quick"><button onClick={() => setQuick(product)}>QUICK VIEW</button><button onClick={() => addItem({ id:product.id,name:product.name,price:product.price,meta:`Size ${product.sizes[0]}`,qty:1 })}>ADD TO BAG</button></div></article>)}</div></section>

      <section className="one-section" id="one-of-one"><div className="one-copy"><p className="kicker acid">ONE OWNER. ONE TIME.</p><h2>THERE’S<br />ONLY ONE.</h2><p>One piece. One owner. Once it’s gone, it’s gone.</p><button className="button button-light" onClick={() => setQuick(products[1])}>SHOP ONE-OF-ONES</button></div><div className="one-art"><span className="giant-mark">✦</span><div className="one-label">AFTER HOURS FLARE<br /><b>1 / 1</b></div></div></section>

      <section className="custom-intro section" id="custom"><p className="kicker acid">THE CUSTOM DENIM PROCESS</p><h2>SEND YOUR JEANS.<br /><em>GET BACK SOMETHING DIFFERENT.</em></h2><div className="steps">{[["01","Choose your package"],["02","Ship your jeans"],["03","We get to work"],["04","Get your one-of-one back"]].map(([no,label])=><div className="step" key={no}><b>{no}</b><span>{label}</span></div>)}</div><p className="turnaround">CURRENT TURNAROUND <b>3–4 DAYS</b> AFTER YOUR GARMENT ARRIVES.</p></section>

      <section className="packages section"><div className="section-head"><div><p className="kicker">CHOOSE YOUR TRANSFORMATION</p><h2>CUSTOM PACKAGES</h2></div></div><div className="package-grid">{customPackages.map((pkg)=><article className="package" key={pkg.id}><span className="package-no">{pkg.no}</span><p>{pkg.subtitle}</p><h3>{pkg.name}</h3><ul>{pkg.details.map(x=><li key={x}>{x}</li>)}</ul><div className="package-buy"><strong>FROM ${pkg.price}</strong><button onClick={()=>addItem({id:pkg.id,name:pkg.name,price:pkg.price,meta:"Customer garment • Standard finish",qty:1})}>CHOOSE THIS PACKAGE →</button></div></article>)}</div></section>

      <section className="before-after section"><div className="section-head inverse"><div><p className="kicker acid">THE URSEWBRO EFFECT</p><h2>FROM REGULAR TO<br />ONE-OF-ONE.</h2></div></div><div className="comparison"><div className="compare-panel before"><span>PLAIN DENIM</span><div className="pants">II</div></div><div className="compare-panel after" style={{clipPath:`inset(0 0 0 ${before}%)`}}><span>URSEWBRO CUSTOM</span><div className="pants">??</div></div><input aria-label="Before and after comparison" type="range" min="5" max="95" value={before} onChange={(e)=>setBefore(Number(e.target.value))} /><div className="compare-line" style={{left:`${before}%`}}><b>↔</b></div></div></section>

      <section className="lookbook section paper" id="lookbook"><div className="section-head"><div><p className="kicker">SEEN IN THE WILD</p><h2>LOOKBOOK / 001</h2></div><a href="#quote">LIKE THIS LOOK? ↗</a></div><div className="look-grid"><div className="look tall"><Image src="/brand/custom-jeans-packages.png" alt="UrSewBro custom denim package campaign" fill sizes="50vw" /></div><div className="look logo-look"><Image src="/brand/ursewbro-logo.png" alt="UrSewBro masked sewing logo" fill sizes="30vw" /></div><div className="look social-look"><Image src="/brand/sewcial-club.png" alt="UrSewBro Sewcial Club campaign" fill sizes="30vw" /></div></div></section>

      <section className="about-split"><div className="about-copy"><p className="kicker acid">ABOUT URSEWBRO</p><h2>NOT MASS<br />PRODUCED.<br /><em>MADE DIFFERENT.</em></h2><p>UrSewBro is a self-taught designer turning everyday garments into one-of-one work. Every cut, patch, flare, and stitch is built by hand—not pulled from a rack.</p><a className="text-link" href="#quote">BUILD SOMETHING WITH US →</a></div><div className="studio-note"><span>MEASURE TWICE</span><b>CUT<br />DIFFERENT.</b><span>SEW IT YOUR WAY</span></div></section>

      <section className="sewcial section" id="sewcial"><div className="sewcial-art"><Image src="/brand/sewcial-club.png" alt="UrSewBro Sewcial Club poster" fill sizes="(max-width: 800px) 100vw, 42vw" /></div><div className="sewcial-copy"><p className="kicker acid">A COMMUNITY BUILT ON CREATIVITY, SUPPORT & STITCHES</p><h2>WELCOME TO<br />URSEWBRO’S<br /><em>SEWCIAL CLUB.</em></h2><p>No gatekeeping. No pressure. Just good vibes, creativity and stitches.</p><ul><li>Learn new sewing skills</li><li>Create custom pieces</li><li>Connect with other creatives</li><li>Turn hobbies into businesses</li></ul><div className="live"><i></i><b>LIVE DAILY</b> 8:30 PM–10:00 PM EST</div><div className="hero-buttons"><a className="button button-light" href="https://instagram.com/ursewbro">Join the community</a><a className="button button-outline" href="https://instagram.com/ursewbro">Follow @ursewbro</a></div></div></section>

      <section className="quote section paper" id="quote"><div className="quote-title"><p className="kicker">CUSTOM DESIGN REQUEST</p><h2>GOT SOMETHING<br />ELSE IN MIND?</h2><p>Tell UrSewBro what you’re trying to create. We’ll turn the details into a clear quote.</p></div><form onSubmit={submitQuote} className="quote-form"><div className="form-row"><label>FIRST NAME<input required name="firstName" /></label><label>LAST NAME<input required name="lastName" /></label></div><div className="form-row"><label>EMAIL<input required type="email" name="email" /></label><label>PHONE<input type="tel" name="phone" /></label></div><div className="form-row"><label>GARMENT TYPE<select name="garment"><option>Jeans</option><option>Pants</option><option>Jacket</option><option>Hoodie</option><option>Shirt</option><option>Full outfit</option><option>Other</option></select></label><label>YOUR BUDGET<select name="budget"><option>Under $100</option><option>$100–$200</option><option>$200–$350</option><option>$350–$500</option><option>$500+</option><option>Not sure</option></select></label></div><label>WHAT DO YOU WANT DONE?<textarea required name="details" rows={4} placeholder="Patches, flares, dye, distressing, a full rebuild… tell us everything." /></label><label>UPLOAD INSPIRATION<input type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,application/pdf" /></label><p className="fineprint">Reference images help communicate the idea. Final UrSewBro designs remain original and may vary based on garment construction and materials.</p><button className="button dark-button" type="submit">GET MY QUOTE →</button><p className="form-status" data-status aria-live="polite"></p></form></section>

      <section className="faq section"><div className="section-head inverse"><div><p className="kicker acid">NEED TO KNOW</p><h2>FAQ / THE DETAILS</h2></div></div><div className="faq-list">{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>

      <section className="reviews section paper"><p className="kicker">WORD ON THE STREET</p><div className="review-grid"><blockquote>“The fit came back perfect. It doesn’t feel like a custom version of my jeans—it feels like a completely new piece.”<footer>★★★★★ — MARCUS / ATLANTA</footer></blockquote><blockquote>“No gatekeeping and no weird pressure. UrSewBro understood the idea and made it better.”<footer>★★★★★ — NIA / BALTIMORE</footer></blockquote></div></section>

      <section className="newsletter"><div><p className="kicker acid">DROP ALERTS</p><h2>DON’T MISS<br />THE NEXT DROP.</h2><p>One-of-one doesn’t restock.</p></div><form action="/api/newsletter" method="post"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" required placeholder="YOUR EMAIL ADDRESS" /><button type="submit">KEEP ME POSTED →</button></form></section>

      <footer className="footer"><div className="footer-brand"><Image src="/brand/ursewbro-logo.png" alt="UrSewBro" width={170} height={170} /><p>CUSTOM. CREATIVE.<br />ONE-OF-A-KIND.</p></div>{[["SHOP","New Drops","One-of-Ones","Custom Jeans","All Products"],["HELP","FAQ","Shipping","Returns","Track Order"],["URSEWBRO","About","Lookbook","Sewcial Club","Instagram"],["LEGAL","Privacy","Terms","Accessibility"]].map(([title,...links])=><div key={title}><h3>{title}</h3>{links.map(x=><a href="#" key={x}>{x}</a>)}</div>)}<div className="footer-bottom">© 2026 URSEWBRO. ALL RIGHTS RESERVED. <span>BUILT WITH THREAD. WORN WITH ATTITUDE.</span></div></footer>

      {quick && <div className="modal-backdrop" onClick={()=>setQuick(null)}><section className="quick-modal" onClick={(e)=>e.stopPropagation()}><button className="close" onClick={()=>setQuick(null)}>×</button><div className={`quick-art ${quick.tone}`}>{quick.art}</div><div><p className="kicker">{quick.category}</p><h2>{quick.name}</h2><strong className="quick-price">${quick.price}</strong><p>{quick.description}</p><label>SIZE<select id="quick-size">{quick.sizes.map(size=><option key={size}>{size}</option>)}</select></label><button className="button dark-button" onClick={()=>addItem({id:quick.id,name:quick.name,price:quick.price,meta:`Size ${quick.sizes[0]}`,qty:1})}>ADD TO BAG →</button></div></section></div>}

      <aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}><div className="cart-head"><h2>YOUR BAG / {cart.reduce((n,x)=>n+x.qty,0)}</h2><button onClick={()=>setCartOpen(false)}>×</button></div><div className="cart-items">{cart.length===0?<p>Your bag is waiting for something different.</p>:cart.map((item,index)=><div className="cart-item" key={`${item.id}-${index}`}><div className="cart-thumb">✂</div><div><h3>{item.name}</h3><p>{item.meta}</p><button onClick={()=>setCart(cart.filter((_,i)=>i!==index))}>REMOVE</button></div><strong>${item.price*item.qty}</strong></div>)}</div><div className="cart-foot"><div><span>SUBTOTAL</span><strong>${subtotal}</strong></div><p>Custom items may require additional production time.</p><button disabled={!cart.length} onClick={checkout}>SECURE CHECKOUT →</button></div></aside>{cartOpen && <button className="drawer-scrim" onClick={()=>setCartOpen(false)} aria-label="Close cart" />}

      <button className="sewit-pin" onClick={()=>setChatOpen(!chatOpen)} aria-label="Open SewIT chat"><span>• •</span></button>{!chatOpen && <div className="pin-bubble">Need help? Pin me.</div>}
      {chatOpen && <section className="chat-panel"><header><div className="mini-pin">••</div><div><b>SEWIT</b><span>URSEWBRO ASSISTANT</span></div><button onClick={()=>setChatOpen(false)}>×</button></header><div className="chat-messages">{chat.map((message,i)=><p className={message.startsWith("You:")?"user-message":"bot-message"} key={`${message}-${i}`}>{message}</p>)}</div><div className="chat-chips"><button onClick={()=>setChat([...chat,"Package 2 is Disoriented Flares: patchwork, flare conversion, and optional distressing. Base price is $195."])}>PACKAGE 2?</button><button onClick={()=>setChat([...chat,"Yep. Choose your package first, then we’ll send shipping instructions."])}>SEND MY JEANS?</button></div><form onSubmit={sendChat}><input name="message" aria-label="Message SewIT" placeholder="Ask SewIT…" /><button>↑</button></form></section>}
    </main>
  );
}
