import{s as q,a as w,n as k,c as D}from"../chunks/scheduler.DS91rSuP.js";import{S as H,i as I,e as f,t as P,s as C,c as m,a as A,b as R,d as h,f as v,k as y,l as x,g as b,h as s}from"../chunks/index.DgkwxDeZ.js";import{c as S}from"../chunks/confetti-guy.DIiN6Uad.js";import{p as Y}from"../chunks/stores.CT-LawGw.js";function j(r){let t,a="You still have a lot to learn!";return{c(){t=f("p"),t.textContent=a},l(e){t=m(e,"P",{"data-svelte-h":!0}),y(t)!=="svelte-1lg4gl5"&&(t.textContent=a)},m(e,l){b(e,t,l)},d(e){e&&h(t)}}}function M(r){let t,a="Great work! You are truly a Confetti Guy!";return{c(){t=f("p"),t.textContent=a},l(e){t=m(e,"P",{"data-svelte-h":!0}),y(t)!=="svelte-1ck2dkj"&&(t.textContent=a)},m(e,l){b(e,t,l)},d(e){e&&h(t)}}}function T(r){let t,a,e,l,_,d,i,G,g,o,E="Try Again";function $(c,n){var u;return(u=c[0])!=null&&u.includes("Confetti Guy")?M:j}let p=$(r)(r);return{c(){t=f("header"),a=f("h1"),e=P("Rank: "),l=P(r[0]),_=C(),p.c(),d=C(),i=f("img"),g=C(),o=f("a"),o.textContent=E,this.h()},l(c){t=m(c,"HEADER",{});var n=A(t);a=m(n,"H1",{});var u=A(a);e=R(u,"Rank: "),l=R(u,r[0]),u.forEach(h),_=v(n),p.l(n),d=v(n),i=m(n,"IMG",{src:!0,alt:!0}),g=v(n),o=m(n,"A",{href:!0,"data-svelte-h":!0}),y(o)!=="svelte-mdi5hg"&&(o.textContent=E),n.forEach(h),this.h()},h(){w(i.src,G=S)||x(i,"src",G),x(i,"alt","Drawing of Confetti Guy"),x(o,"href","/game")},m(c,n){b(c,t,n),s(t,a),s(a,e),s(a,l),s(t,_),p.m(t,null),s(t,d),s(t,i),s(t,g),s(t,o)},p:k,i:k,o:k,d(c){c&&h(t),p.d()}}}function z(r,t,a){let e;return D(r,Y,_=>a(1,e=_)),[e.url.searchParams.get("rank")]}class N extends H{constructor(t){super(),I(this,t,z,T,q,{})}}export{N as component};