import { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   BLACK LETTER — rule drilling for 1Ls
   ------------------------------------------------------------
   DECK SCHEMA (paste generated JSON into DECK below):
   {
     id: "unique-id",
     type: "cloze" | "flash" | "mcq",
     concept: "short label shown on card",
     why: "why it matters / case anchor (shown after grading)",

     // cloze: text with {{answers}} inline
     text: "An offer is the {{manifestation}} of ...",

     // flash:
     prompt: "question",
     answer: ["line 1", "line 2"],          // or a string
     fallback: "cloze text with {{blanks}}", // tier-2 fill-in

     // mcq:
     scenario: "fact pattern",
     options: ["A", "B", "C", "D"],
     correct: 1,                             // index
     explanation: "why"
   }
   Proficiency: 0 = study pile, 1–3 learning, 4–5 mastered.
   ============================================================ */

const DECK = {
  contracts: {
    name: "Contracts",
    cards: [
      {
        id: "c-sources", type: "cloze",
        concept: "Sources of contract law",
        text: "Common law is {{judge}}-made law that applies to {{services}} (guided by the Restatement (Second) of Contracts); the UCC is {{statutory}} law that applies to {{goods}} (Article 2).",
        why: "The professor calls this one of the most important concepts in the course — every problem starts with which body of law governs.",
      },
      {
        id: "c-formation", type: "cloze",
        concept: "Contract formation ingredients",
        text: "Formation needs all three: an {{offer}} and an {{acceptance}} — together, the meeting of the {{minds}} — plus {{consideration}}, the bargained-for exchange.",
        why: "The professor's asterisk on 'Need* all three': promissory estoppel and restitution are the workarounds when an ingredient is missing.",
      },
      {
        id: "c-objective", type: "cloze",
        concept: "Objective theory — Lucy v. Zehmer",
        text: "We must look to the {{outward}} expression of a person as manifesting his intention rather than to his {{secret}} and unexpressed intention; the law imputes an intention corresponding to the {{reasonable}} meaning of his words and acts.",
        why: "Lucy v. Zehmer, 84 S.E.2d 516 (Va. 1954): drunk or not, the parties memorialized an unambiguous agreement — they're stuck with it.",
      },
      {
        id: "c-consid-types", type: "flash",
        concept: "Consideration — four types",
        prompt: "The four types of consideration, with the professor's examples?",
        answer: [
          "1) Return promise — 'I'll pay you $100 if you promise to pay me $110 next year.'",
          "2) Performance: an act other than a promise — '$100 once you sing Bohemian Rhapsody.'",
          "3) Performance: forbearance — '$100 if you do not punch me.'",
          "4) Performance: affecting legal relations — '$100 if you accept termination from my company.'",
        ],
        fallback: "A return {{promise}}; an {{act}} other than a promise; {{forbearance}}; or affecting legal {{relations}}.",
        why: "Bargained-for exchange, per the Restatement — each type is something sought by the promisor and given in exchange.",
      },
      {
        id: "c-dougherty", type: "flash",
        concept: "Dougherty v. Salt",
        prompt: "Dougherty v. Salt — what's the rule from the aunt's promissory note?",
        answer: [
          "Consideration that has already been received doesn't support a future promise.",
          "The note to the nephew was a gratuitous promise dressed as a contract — no exchange, no enforcement.",
        ],
        fallback: "Consideration {{already}} received does not support a {{future}} promise.",
        why: "Past consideration is no consideration — the same defect that later sinks Mills and Harrington.",
      },
      {
        id: "c-hamer", type: "flash",
        concept: "Hamer v. Sidway",
        prompt: "Hamer v. Sidway — what counted as consideration, and what did the uncle's estate argue?",
        answer: [
          "Abstaining from exercising your legal right can be consideration — the nephew gave up drinking, cards, etc. until 21.",
          "The estate argued the uncle received no benefit — the court held benefit to the promisor is not required; the promisee's forbearance (giving up a legal right) is enough.",
        ],
        fallback: "{{Abstaining}} from exercising a legal {{right}} can be consideration; a {{benefit}} to the promisor is not required.",
        why: "Second issue: the nephew argued the uncle held the $5,000 in trust — which defeated the statute-of-limitations defense.",
      },
      {
        id: "c-military", type: "flash",
        concept: "Military College v. Brooks — § 74(1)",
        prompt: "When is forbearance from asserting a claim valid consideration?",
        answer: [
          "Forbearance from asserting a claim is valid consideration.",
          "But forbearing an INVALID claim is not consideration unless: (a) the claim or defense is in fact doubtful due to uncertainty of facts or law, OR (b) the forbearing party believes the claim may be fairly determined to be valid.",
        ],
        fallback: "Forbearing an invalid claim is not consideration unless the claim is {{doubtful}} as to facts or law, or the forbearing party {{believes}} it may fairly be determined valid.",
        why: "Restatement 2d § 74(1). The line between settlement and extortion — good-faith doubt is what separates them.",
      },
      {
        id: "c-langer", type: "flash",
        concept: "Langer v. Superior Steel",
        prompt: "Langer v. Superior Steel — how much benefit to the promisor is enough for consideration?",
        answer: [
          "Almost any benefit to the promisor is consideration.",
          "'It is reasonable to conclude that it is to the advantage of the [promisor] if the [promisee] ... is not employed by a competitive company.'",
        ],
        fallback: "Almost {{any}} benefit to the {{promisor}} is consideration — e.g., the retiree not working for a {{competitive}} company.",
        why: "Contrast Kirksey: a real (even small) benefit flowing to the promisor is exchange; a condition merely necessary to receive a gift is not.",
      },
      {
        id: "c-kirksey", type: "flash",
        concept: "Kirksey v. Kirksey — gift vs. consideration",
        prompt: "Kirksey v. Kirksey — why did the widow lose, and what's the exchange vs. gratuitous condition test?",
        answer: [
          "If the 'consideration' is just a necessary requirement of receiving the gift, it may not be valid consideration — her move was merely the condition of a gratuity.",
          "Exchange: going to the store to get out of the photograph is a BENEFIT to the promisor.",
          "Gratuitous condition: going to the store is merely necessary to effect the gift.",
        ],
        fallback: "A condition merely {{necessary}} to receive a {{gift}} is not consideration; ask whether the act is a {{benefit}} to the promisor.",
        why: "The brother-in-law's letter induced her to abandon her land — but inducement alone isn't bargain. (Modern lawyers would plead promissory estoppel.)",
      },
      {
        id: "c-pe-elements", type: "flash",
        concept: "Promissory estoppel — Restatement § 90",
        prompt: "Promissory estoppel: the four elements the asserting party must prove, with the professor's gloss on each?",
        answer: [
          "1) A promise — not an entire contract; just a promise, but it must be sufficiently definite.",
          "2) Promisor should reasonably expect it to induce action or forbearance — focus on the promisor's objective reasonableness.",
          "3) It ACTUALLY induces the action or forbearance — only counts if it does.",
          "4) Injustice can be avoided only by enforcement — the final stopgap.",
        ],
        fallback: "1) A sufficiently definite {{promise}} 2) promisor should reasonably {{expect}} it to induce action or {{forbearance}} 3) it {{actually}} induces it 4) {{injustice}} avoidable only by enforcement.",
        why: "Reliance as a SUBSTITUTE for consideration — remedy may be limited as justice requires.",
      },
      {
        id: "c-ricketts", type: "flash",
        concept: "Ricketts v. Scothorn",
        prompt: "Ricketts v. Scothorn — what doctrine, and what's the takeaway?",
        answer: [
          "Equitable estoppel (estoppel in pais) applied to a promise: grandfather's note induced her to quit her job.",
          "Justified reliance on a promise can make it enforceable — the promisor is precluded from asserting lack of consideration after inducing the change of position.",
        ],
        fallback: "{{Justified}} reliance on a promise can create an enforceable obligation — estoppel in {{pais}}.",
        why: "The historical bridge to § 90 promissory estoppel.",
      },
      {
        id: "c-stewart", type: "flash",
        concept: "Stewart v. Cendant Mobility",
        prompt: "Stewart v. Cendant — what was the reliance, and why did she win on estoppel after losing on contract?",
        answer: [
          "The reliance: she STAYED with the company (and didn't pursue other employment) on the assurance that her husband joining a competitor wouldn't affect her job.",
          "The jury found no contract (no definite offer) — but promissory estoppel doesn't require the promise to be the functional equivalent of an offer. Reliance did the work consideration would have done.",
        ],
        fallback: "Her {{reliance}} was staying and not seeking other work; a § 90 promise need not equal a contractual {{offer}}.",
        why: "The card-catalog error to avoid: her staying was RELIANCE, not consideration — no contract ever formed.",
      },
      {
        id: "c-ue-elements", type: "flash",
        concept: "Unjust enrichment — elements & benefits",
        prompt: "Unjust enrichment: the two elements, and the four example categories of 'benefit'?",
        answer: [
          "1) Receipt of a benefit from the plaintiff, AND 2) retention of the benefit is unjust. The plaintiff must show both.",
          "Benefits: grant of possessory interest (money, land, possessions); performing services (beneficial to, or at the request of, the defendant); satisfaction of the defendant's debt; other benefits ('in any way adds to the other's advantage').",
        ],
        fallback: "1) Receipt of a {{benefit}} from plaintiff 2) retention is {{unjust}}; benefits include a possessory {{interest}}, performing {{services}}, satisfying a {{debt}}, or anything adding to the other's advantage.",
        why: "Restitution is SUBORDINATE to contracts — if a contract governs, restitution stays out.",
      },
      {
        id: "c-ue-exceptions", type: "flash",
        concept: "Unjust enrichment — element 2 exceptions",
        prompt: "Unjust enrichment's second element is that retaining the benefit is unjust. What are the two exceptions that make retention NOT unjust?",
        answer: [
          "Unrequested benefit voluntarily conferred: gratuitously choosing to confer a benefit instead of entering a contract creates no compensation obligation.",
          "Forced exchange: receiving unrequested services the party would not necessarily have purchased at market value creates no compensation obligation.",
        ],
        fallback: "An unrequested benefit {{voluntarily}} conferred, and a {{forced}} exchange — neither creates a {{compensation}} obligation.",
        why: "The lumberjack hypo: cutting a neighbor's dying tree unasked is both a volunteer's gratuity and a forced exchange.",
      },
      {
        id: "c-sparks", type: "flash",
        concept: "Sparks v. Gustafson",
        prompt: "Sparks v. Gustafson — outcome, and how did the court distinguish Kershaw?",
        answer: [
          "Inequitable for the Estate to receive professional services while retaining the benefits of those services — Gustafson recovers.",
          "Kershaw distinguished: those were the ordinary favors of a long-time friend; Gustafson's were extensive BUSINESS services (managing, repairing, paying bills out of pocket for years) — the kind one would ordinarily expect to pay for.",
        ],
        fallback: "Inequitable for the Estate to receive {{professional}} services while retaining their {{benefits}}; unlike Kershaw, these went beyond what {{friendship}} ordinarily provides.",
        why: "The gratuitous-services exception has a ceiling: extent and business character override the friendship inference.",
      },
      {
        id: "c-moral-2types", type: "flash",
        concept: "Promises for benefits received — two types",
        prompt: "The professor's two categories of promises for benefits received, and their default enforceability?",
        answer: [
          "1) Gratitude for past actions / moral consideration → NOT always enforceable.",
          "2) Subsequent affirmation of an unenforceable promise → TYPICALLY enforceable.",
        ],
        fallback: "Gratitude for {{past}} actions — not always enforceable; subsequent {{affirmation}} of an unenforceable promise — typically enforceable.",
        why: "Mills v. Wyman lives in category one: certain promises for benefits received are unenforceable notwithstanding any 'moral obligation.'",
      },
      {
        id: "c-moral-split", type: "flash",
        concept: "When is moral consideration enough?",
        prompt: "The jurisdictional split on moral consideration — three positions, and the case for each side of the Webb/Harrington divide?",
        answer: [
          "YES — a material benefit received can support an enforceable promise (Webb v. McGowin: Webb saved McGowin's life at the cost of his own ability to work; monthly payments enforced against the estate).",
          "YES, BUT — the promise is enforceable only to the extent of the benefit.",
          "NO — bargained-for exchange required at the moment of contract (Mills v. Wyman; Harrington v. Taylor: hand mutilated saving an attacker from an axe, promise still unenforceable).",
        ],
        fallback: "Yes — {{material}} benefit can support the promise (Webb); yes-but — only to the {{extent}} of the benefit; no — {{bargained}}-for exchange required at contracting (Mills, Harrington).",
        why: "Professor's ambiguity playbook: exams and the bar — argue BOTH interpretations; in practice — advise and prep backup arguments; friends & family — refer out.",
      },
      {
        id: "c-rest86", type: "flash",
        concept: "Restatement § 86 — the resolution",
        prompt: "How does Restatement § 86 resolve the moral-consideration problem?",
        answer: [
          "A promise made in recognition of a benefit previously received by the promisor from the promisee is binding to the extent necessary to prevent injustice.",
          "NOT binding if the promisee conferred the benefit as a gift, or the promisor was not unjustly enriched — or to the extent its value is disproportionate to the benefit.",
        ],
        fallback: "Binding to the extent necessary to prevent {{injustice}}; not binding if conferred as a {{gift}} or to the extent {{disproportionate}} to the benefit.",
        why: "Note the anchor: benefit received by the PROMISOR — a third party's gratitude (Charlie promising for Bob's rescue) falls outside it.",
      },
      {
        id: "c-offer-def", type: "cloze",
        concept: "Offer — Restatement §§ 24, 26",
        text: "An offer is the {{manifestation}} of willingness to enter into a bargain, so made as to {{justify}} another person in understanding that their {{assent}} to that bargain is invited and will {{conclude}} it.",
        why: "§ 26's flip side: no offer if the addressee knows or has reason to know the maker doesn't intend to conclude a bargain without a further manifestation of assent. If 'I accept' would create mutual obligations — it's probably an offer.",
      },
      {
        id: "c-offer-factors", type: "flash",
        concept: "Factors indicating an offer",
        prompt: "The eight factors indicating an offer (and your mnemonic)?",
        answer: [
          "Finality — willing to be bound on acceptance? · Completeness — substantially all terms? · Context — indicates hope for acceptance? · Audience — broad audience is less likely an offer.",
          "Jargon — 'this is a legally binding offer' tends to make it so · Method of acceptance — specifying one makes it more offer-like · Public policy/fairness — exploiting ambiguity cuts against binding · Accepted practice — course of dealing can bind.",
          "Mnemonic: Fuckin Critics Can't Always Judge My Poor Attitude.",
        ],
        fallback: "{{Finality}}, {{completeness}}, context, {{audience}}, jargon, method of {{acceptance}}, public policy, accepted {{practice}}.",
        why: "The professor's caveat, twice on the slides: NONE of these is necessarily dispositive — they're weighing factors, not elements.",
      },
      {
        id: "c-moulton", type: "flash",
        concept: "Moulton v. Kershaw",
        prompt: "Moulton v. Kershaw — why wasn't the salt letter an offer?",
        answer: [
          "A general proposal is not necessarily an offer.",
          "'We are authorized to offer' read as trade solicitation, addressed generally; no quantity term bounded what Kershaw was willing to sell — an order for 2,000 barrels couldn't close a deal that never fixed an amount.",
        ],
        fallback: "A {{general}} proposal is not necessarily an offer — solicitation language plus no {{quantity}} limit.",
        why: "The court's counterfactual: 'we will sell you all the salt you will order' WOULD have been binding.",
      },
      {
        id: "c-nordyne", type: "flash",
        concept: "Nordyne v. ICM",
        prompt: "Nordyne v. ICM — when can a price quotation be an offer, and what was the acceptance here?",
        answer: [
          "Price quotations can be offers based on the course of dealing of the parties and the manner in which they invite acceptance.",
          "ICM's July 29 quotation (negotiated for months, complete terms, sent to one buyer, custom product) = OFFER; Nordyne's September 15 signature on ICM's sign-off letter = ACCEPTANCE — which is why ICM's invoice terms (forum selection) governed.",
        ],
        fallback: "Quotations can be offers based on the course of {{dealing}} and the manner of inviting {{acceptance}}; the {{quotation}} was the offer and the production sign-off the acceptance.",
        why: "Restatement § 26 cmt. c factors: prior inquiry, completeness of terms, number of recipients.",
      },
      {
        id: "c-fairmount", type: "flash",
        concept: "Fairmount Glass Works",
        prompt: "Fairmount Glass Works — was the seller's quote an offer? Reconcile with Moulton.",
        answer: [
          "Yes. The buyer asked for the lowest price on a SPECIFIC order — ten car loads of Mason jars — and the seller quoted prices 'for immediate acceptance.'",
          "Reconciliation: a quote RESPONDING to a specific inquiry (quantity supplied by the inquiry) with acceptance-inviting language is an offer; Moulton's letter was unsolicited, general, and quantity-less.",
        ],
        fallback: "A quote answering a {{specific}} inquiry, with quantity fixed by the inquiry, 'for immediate {{acceptance}}' — an {{offer}}, unlike Moulton's general letter.",
        why: "The middle case in the Moulton → Fairmount → Nordyne line: context and invitation language flip a 'quote' into an offer.",
      },
      {
        id: "c-ad-test", type: "flash",
        concept: "Is an advertisement an offer?",
        prompt: "The three questions for whether an advertisement is an offer, with the case anchors?",
        answer: [
          "1) Performance — was some performance promised in positive terms in return for something requested?",
          "2) Definiteness — is it clear, definite, and explicit, leaving nothing open for negotiation? (Lefkowitz: '1 Black Lapin Stole ... $1.00 First Come First Served' — offer, accepted by being first.)",
          "3) Other facts — do circumstances show the advertiser intended an offer? (Leonard: obvious joke, terms deferred to catalog, no limiting words — no offer.)",
          "Default (Craft v. Elder & Johnston): absent special circumstances, an ad is a mere invitation for the audience to make an offer.",
        ],
        fallback: "1) {{performance}} promised in positive terms for something requested 2) clear, {{definite}}, explicit, nothing open for {{negotiation}} 3) other {{facts}} showing intent. Default: an ad is an {{invitation}} to make an offer.",
        why: "Craft states the rule, Lefkowitz the exception, Leonard the limit — one line of doctrine, three cases.",
      },
      {
        id: "c-acceptance-def", type: "cloze",
        concept: "Acceptance — Restatement § 50",
        text: "An acceptance is the manifestation of {{assent}} to the terms of the offer, made by the {{offeree}} in a manner {{invited}} or required by the offer.",
        why: "Mirror of § 24: the offeror is master of the offer — the manner of acceptance is the offeror's to set.",
      },
      {
        id: "c-accept-factors", type: "flash",
        concept: "Acceptance factors",
        prompt: "The six acceptance factors (and your mnemonic)?",
        answer: [
          "Finality of acceptance — if the proposal lets the offeror approve the 'acceptance,' the proposal was never an offer.",
          "Method — by default, an offer invites acceptance in any reasonable manner.",
          "Acceptance by Promise · Acceptance by Performance.",
          "Mirror image rule — changing a material term = counteroffer; requesting changes without conditioning = still an acceptance (UCC has special rules — Sept. 1).",
          "Notice — the offeree must normally inform the offeror before the offer expires.",
          "Mnemonic: For My Pretty Panda Ms. Nori.",
        ],
        fallback: "{{Finality}}, {{method}}, acceptance by {{promise}}, acceptance by {{performance}}, the {{mirror}} image rule, and {{notice}}.",
        why: "Nonexhaustive factors, same as the offer side — not elements.",
      },
      {
        id: "c-promise-v-perf", type: "flash",
        concept: "Acceptance by promise vs. performance",
        prompt: "What completes acceptance by promise vs. by performance — and what if the offer is ambiguous?",
        answer: [
          "Promise: the offeree must complete every act essential to the making of the promise (including notice).",
          "Performance: at least part of what the offer requests must be performed or tendered — mere preparation to perform is insufficient.",
          "Ambiguous offer: the offeree can accept by promise OR performance.",
        ],
        fallback: "Promise: complete every act essential to {{making}} the promise; performance: at least {{part}} performed or tendered — mere {{preparation}} is insufficient; if ambiguous, {{either}} works.",
        why: "Restatement § 50 — the porch, cottage, and 'ship at once' hypos all turn on which mode the offer invites.",
      },
      {
        id: "c-hendricks", type: "flash",
        concept: "Hendricks v. Behee",
        prompt: "Hendricks v. Behee — the notice rule, and why did Behee win?",
        answer: [
          "'There is no contract until acceptance of an offer is communicated to the offeror. An uncommunicated intention to accept is not an acceptance. When an offer calls for a promise, notice of acceptance is always essential.'",
          "The Smiths signed but never communicated; Behee revoked through the Smiths' agent first — notice to an agent within the scope of authority is notice to the principal. No contract.",
        ],
        fallback: "When acceptance must be made by {{promise}}, the offeror must receive {{actual}} notice; notice to an {{agent}} within authority binds the principal.",
        why: "Hendricks himself was just the escrow agent interpleading the $5,000 deposit — the fight was Behee vs. the Smiths.",
      },
      {
        id: "c-ardente", type: "flash",
        concept: "Ardente v. Horan — conditional acceptance",
        prompt: "Restatement §§ 59 & 61 on conditional acceptance, and how it played out in Ardente?",
        answer: [
          "§ 59: a reply that purports to accept but is CONDITIONAL on assent to additional or different terms is not an acceptance — it's a counteroffer.",
          "§ 61: an acceptance that merely REQUESTS a change is not invalidated — unless the acceptance is made to depend on assent to the change.",
          "Ardente: conditioning the acceptance on inclusion of the sun parlor furniture converted the acceptance into a counteroffer — no contract.",
        ],
        fallback: "A {{conditional}} acceptance is a {{counteroffer}}; a mere {{request}} for changes survives unless the acceptance is made to {{depend}} on assent.",
        why: "An acceptance that doesn't mirror the offer may not be valid — watch for 'confirm that X is part of the transaction' language.",
      },
      {
        id: "c-termination", type: "flash",
        concept: "Terminating the offer — five ways",
        prompt: "The five ways an offer terminates?",
        answer: [
          "1) Rejection — ends the acceptability of the offer.",
          "2) Revocation — any time prior to acceptance.",
          "3) Counteroffer — acts as a rejection (a conditional acceptance can be a counter).",
          "4) Lapse of time — after a 'reasonable amount of time' or the time stated in the offer.",
          "5) Death of the offeror — death of the offeror means the death of the offer.",
        ],
        fallback: "{{Rejection}}, {{revocation}}, {{counteroffer}}, {{lapse}} of time, and {{death}} of the offeror.",
        why: "After termination, the offer cannot be accepted — the power of acceptance is gone.",
      },
      {
        id: "c-dodds", type: "flash",
        concept: "Dickinson v. Dodds + Restatement §§ 43, 87(2)",
        prompt: "Dickinson v. Dodds — the two rules, plus the two Restatement follow-ons?",
        answer: [
          "Revoking the offer before acceptance terminates the offer — the promise to hold it open until Friday, without consideration, was not binding.",
          "Key quote: 'It is impossible ... to say there was ever that existence of the same mind between the two parties which is essential ... to the making of an agreement.'",
          "§ 43 (revocation through action): the power of acceptance ends when the offeror takes definite action inconsistent with the proposed contract AND the offeree acquires reliable information of it.",
          "§ 87(2): an offer that should reasonably be expected to induce substantial reliance before acceptance, and does, is binding as an OPTION CONTRACT to the extent necessary to prevent injustice.",
        ],
        fallback: "A gratuitous hold-open promise is not {{binding}}; the power of acceptance ends on definite {{inconsistent}} action plus {{reliable}} information; substantial pre-acceptance {{reliance}} can create an option under § 87(2).",
        why: "Dickinson knew Dodds was selling to Allan before 'accepting' — the minds never met at the moment of acceptance.",
      },
      {
        id: "c-mailbox", type: "cloze",
        concept: "Mailbox rule — Restatement § 63(a)",
        text: "Unless the offer provides otherwise, an acceptance made in an invited manner is operative as soon as put out of the offeree's {{control}} — regardless of whether it ever {{reaches}} the offeror; but revocations, rejections, and second-move acceptances are valid only upon actual {{receipt}}.",
        why: "Morrison v. Thoelke: the contract is complete on MAILING, barring repudiation before delivery. The professor's slide: WARNING — dispatch timing applies ONLY to first-move acceptances.",
      },
      {
        id: "c-overtake", type: "flash",
        concept: "Mailbox — overtaking rule",
        prompt: "You mail a rejection, then change your mind and mail an acceptance. What result?",
        answer: [
          "A rejection or counteroffer by mail does not terminate the power of acceptance until RECEIVED.",
          "But an acceptance dispatched AFTER sending a rejection is only a counteroffer — unless the acceptance is received by the offeror BEFORE the rejection arrives (the race).",
        ],
        fallback: "A mailed rejection is effective only on {{receipt}}; an acceptance sent after a rejection is a {{counteroffer}} unless it {{arrives}} first.",
        why: "The one scenario where the mailbox rule's dispatch timing gets suspended — the second move must win the race.",
      },
      {
        id: "c-mcq-ucc", type: "mcq",
        concept: "UCC vs. common law",
        scenario: "A contract for the sale of a cell phone. Which body of law governs?",
        options: [
          "Common law — all consumer contracts are common law",
          "UCC Article 2 — a cell phone is a good",
          "Common law — unless the phone costs over $500",
          "Both apply equally",
        ],
        correct: 1,
        explanation: "UCC Article 2 applies to transactions in goods — movable, tangible things like a phone. Common law (Restatement) governs services. First question in every contracts problem: goods or services?",
        why: "The professor's Day 2 hypo, verbatim.",
      },
      {
        id: "c-mcq-porch", type: "mcq",
        concept: "Acceptance by performance — porch hypo",
        scenario: "Alice, leaving on a month's vacation, tells Bob she'll pay $50 if he paints her porch while she's away. Bob says he may not have time; Alice says he may decide after she leaves. Bob begins painting after Alice leaves. Has Bob accepted?",
        options: [
          "No — Bob never communicated acceptance to Alice",
          "Yes — the offer invited acceptance by performance, and beginning the invited performance is acceptance",
          "No — acceptance occurs only when the porch is fully painted",
          "Yes — but only if Alice learns of the painting before returning",
        ],
        correct: 1,
        explanation: "Alice's offer sought performance, not a promise — and she expressly told Bob to decide after she left, waiving advance notice. Beginning the invited performance (actually painting, not merely buying brushes) operates as acceptance.",
        why: "Contrast mere preparation, which is insufficient — the brush must hit the porch.",
      },
      {
        id: "c-mcq-cottage", type: "mcq",
        concept: "Acceptance by promise — cottage hypo",
        scenario: "Sydney mails Johnny plans for a cottage on Sydney's remote wilderness land, writing: 'If you will AGREE to build a cottage in accordance with the enclosed plans, I will pay you $5,000.' Johnny never responds — but starts building. Can Johnny demand the $5,000?",
        options: [
          "Yes — beginning performance always accepts an offer",
          "No — the offer called for a promise ('if you will agree'), so acceptance required a communicated promise, not silent performance",
          "Yes — Sydney's offer was ambiguous, so either mode works",
          "No — building on another's land is trespass, voiding the contract",
        ],
        correct: 1,
        explanation: "'If you will AGREE to build' seeks a return promise. When an offer calls for a promise, notice of acceptance is always essential (Hendricks) — silently starting to build in a remote wilderness, where Sydney would never learn of it, is not the invited acceptance.",
        why: "Compare the porch hypo: the offer's language picks the mode, and the mode dictates whether notice is required.",
      },
      {
        id: "c-mcq-ship", type: "mcq",
        concept: "Ambiguous mode — 'Ship at once' hypo",
        scenario: "Billy mails Jane a written order for a machine she regularly sells from stock. The order says 'Ship at once.' Jane immediately mails a letter of acceptance instead of shipping. Valid acceptance?",
        options: [
          "No — 'Ship at once' demanded performance, and only shipment accepts",
          "Yes — the offer is ambiguous as to mode, so the offeree may accept by prompt promise OR prompt performance",
          "No — merchants can only accept by shipping goods",
          "Yes — but the contract forms only when the machine arrives",
        ],
        correct: 1,
        explanation: "'Ship at once' is ambiguous — it expresses urgency, not an exclusive mode. Where the offer is ambiguous, the offeree can accept by promise or performance; Jane's immediate mailed acceptance forms the contract (effective on dispatch, per the mailbox rule).",
        why: "The default: an offer invites acceptance in any reasonable manner unless it clearly says otherwise.",
      },
      {
        id: "c-mcq-mailbox", type: "mcq",
        concept: "Mailbox rule — Yael & Zed",
        scenario: "July 1: Yael mails Zed an offer. July 2: Yael mails a revocation. July 3: Zed receives the offer and mails back an acceptance. July 4: Zed receives the revocation. July 5: Yael receives the acceptance. Contract?",
        options: [
          "No — the revocation was mailed before Zed ever accepted",
          "Yes — the acceptance was effective on dispatch (July 3), before the revocation became effective on receipt (July 4)",
          "No — Yael received the acceptance after Zed knew of the revocation",
          "Yes — but only because Yael's revocation was mailed too early",
        ],
        correct: 1,
        explanation: "Acceptances are effective on DISPATCH (mailbox rule); revocations are effective only on RECEIPT. The acceptance operated July 3; the revocation didn't land until July 4 — one day too late. Contract formed July 3.",
        why: "Timeline problems are won by labeling each communication with its effective date before comparing.",
      },
      {
        id: "c-mcq-amps", type: "mcq",
        concept: "Ads as offers — Lefkowitz pattern",
        scenario: "'Saturday 8 A.M. Sharp — 2 vintage amps, worth $900. $5 each. First come, first served.' M arrives first, $5 in hand; the store refuses ('collectors only'). Was the ad an offer?",
        options: [
          "No — advertisements are never offers",
          "Yes — clear, definite, explicit, nothing open to negotiate, and performance (being first) was requested in positive terms",
          "No — no consideration was paid to keep it open",
          "Yes — any ad that states a price is an offer",
        ],
        correct: 1,
        explanation: "This runs the professor's three-part ad test: performance promised in positive terms for something requested (first come = served at $5), fully definite, and the limiting mechanism shows real intent. The 'house rule' came too late — an offeror can modify before acceptance, not after.",
        why: "Lefkowitz — the exception that proves Craft's default rule.",
      },
      {
        id: "c-mcq-jet", type: "mcq",
        concept: "Ads as offers — Leonard pattern",
        scenario: "A TV spot jokingly shows a fighter jet 'for 7,000,000 points.' All redemption details live in a separate catalog, which omits the jet; nothing limits how many viewers could claim one. A viewer tenders $700,000 for points. Offer?",
        options: [
          "Yes — an item plus a stated price is an offer",
          "No — terms were deferred to the catalog, there were no limiting words, and an objective viewer would see a joke",
          "Yes — the viewer's order form was an acceptance",
          "No — TV ads can never be offers",
        ],
        correct: 1,
        explanation: "Leonard v. PepsiCo: the commercial fails all three ad-test questions — no positive-terms performance path (details deferred to the catalog), no limiting words capping acceptances, and the objective circumstances screamed joke. The order form was itself just an offer, never accepted.",
        why: "Lucy's objective theory working in the other direction: a reasonable person would NOT take it seriously.",
      },
      {
        id: "c-mcq-dodds", type: "mcq",
        concept: "Revocation — Dickinson v. Dodds pattern",
        scenario: "Seller signs: 'This offer stays open until Friday 9 A.M.' Buyer pays nothing for that promise. Wednesday the seller sells to someone else; buyer hears of the sale that evening from a reliable third party, then tenders an 'acceptance' Thursday. Contract?",
        options: [
          "Yes — the signed writing made the offer irrevocable",
          "Yes — revocation must come from the offeror personally",
          "No — the gratuitous hold-open promise wasn't binding, and § 43 killed the power of acceptance once buyer reliably learned of the sale",
          "No — real estate offers expire after 24 hours",
        ],
        correct: 2,
        explanation: "No consideration = no option, so the offer stayed freely revocable. Under Restatement § 43, definite inconsistent action (selling to Allan) plus reliable information reaching the offeree terminates the power of acceptance — no formal notice from the offeror needed.",
        why: "Dickinson v. Dodds — and remember § 87(2)'s reliance-based option as the modern counterweight.",
      },
      {
        id: "c-mcq-timing", type: "mcq",
        concept: "Consideration timing — Mills pattern",
        scenario: "While N is nursing L back to health, L says: 'Keep taking care of me and I'll repay every cost when I recover.' N continues the care. L recovers, then refuses to pay. Enforceable?",
        options: [
          "No — past consideration; the care was a completed act",
          "Yes — bargained-for exchange: the promise induced continued care",
          "No — promises to pay for services must be in writing",
          "Yes — but only under the material benefit rule",
        ],
        correct: 1,
        explanation: "The promise came DURING performance and induced its continuation — a real exchange, unlike Mills v. Wyman, where the promise arrived only after the care had fully ended. Timing of the promise decides everything.",
        why: "Dougherty, Mills, and Harrington all fail on the same clock; this hypo moves the promise before the act completes.",
      },
      {
        id: "c-hypo-piano", type: "mcq",
        concept: "Condition of gift vs. consideration — Kirksey line",
        scenario: "Grandmother tells her grandson: 'If you drive to my house on Sunday, I'll give you my old piano.' He drives the two hours; she refuses to hand it over. Enforceable contract?",
        options: [
          "Yes — driving two hours is a detriment, and detriment is consideration (Hamer)",
          "No — the drive was merely a condition necessary to receive the gift, not something the grandmother sought in exchange",
          "Yes — any act performed at the promisor's request is consideration",
          "No — promises between family members are never enforceable",
        ],
        correct: 1,
        explanation: "Kirksey: if the 'consideration' is just a necessary requirement of receiving the gift, it isn't valid consideration. Ask the Langer question — did the drive BENEFIT grandmother, or was it merely how he'd collect the gratuity? Contrast Hamer, where the forbearance was the very thing the uncle bargained for.",
        why: "The exchange-vs-gratuitous-condition line: benefit to the promisor is the tell.",
      },
      {
        id: "c-hypo-claim", type: "mcq",
        concept: "Forbearance of an invalid claim — § 74(1)",
        scenario: "N threatens to sue D over a property-line claim N privately knows is baseless, purely as leverage. D promises $2,000 if N drops it; N does. D refuses to pay. Consideration?",
        options: [
          "Yes — forbearance from asserting a claim is always consideration",
          "No — forbearing an invalid claim is not consideration where the claim isn't doubtful and the forbearing party doesn't believe in it",
          "Yes — D received the benefit of avoiding litigation costs",
          "No — settlement agreements require court approval",
        ],
        correct: 1,
        explanation: "Restatement § 74(1): forbearance of an invalid claim IS consideration only if (a) the claim is genuinely doubtful as to facts or law, or (b) the forbearing party honestly believes it may fairly be determined valid. N flunks both — this is the Military College v. Brooks line between settlement and extortion.",
        why: "Flip the facts: an honestly held, uncertain claim dropped in exchange for payment WOULD be consideration.",
      },
      {
        id: "c-hypo-subbid", type: "mcq",
        concept: "Reliance option — Restatement § 87(2)",
        scenario: "A subcontractor submits a bid to a general contractor, who uses it (as the sub expects) in computing the winning master bid. Before the GC can formally accept, the sub revokes, citing a pricing error. Can the GC hold the sub to the bid?",
        options: [
          "No — an offer is freely revocable any time before acceptance",
          "Yes — the bid is binding as an option contract to the extent necessary to prevent injustice, because it foreseeably induced substantial reliance before acceptance",
          "No — the GC never paid consideration to hold the bid open",
          "Yes — subcontractor bids are irrevocable by statute",
        ],
        correct: 1,
        explanation: "Restatement § 87(2) (in your outline under Dickinson): an offer the offeror should reasonably expect to induce action of a substantial character before acceptance, and which does, is binding as an option to the extent necessary to prevent injustice. The GC's reliance — building the bid into its own — substitutes for the consideration an option would normally require.",
        why: "The modern counterweight to Dickinson v. Dodds' hard rule that gratuitous hold-open promises don't bind.",
      },
      {
        id: "c-hypo-option-mail", type: "mcq",
        concept: "Mailbox rule — option contract exception",
        scenario: "B pays S $500 for an option to buy S's lot, 'exercisable until June 1.' B mails a letter exercising the option May 30; it arrives June 2. Valid exercise?",
        options: [
          "Yes — the mailbox rule makes the acceptance effective on dispatch, May 30",
          "No — acceptance under an option contract is effective only upon RECEIPT, and it arrived after the deadline",
          "Yes — options are construed in favor of the option holder",
          "No — options can only be exercised in person",
        ],
        correct: 1,
        explanation: "The bracketed exception in § 63 you outlined: the mailbox rule does NOT apply to option contracts. An option's acceptance must be RECEIVED within the option period — dispatch isn't enough. June 2 receipt misses a June 1 deadline; the option lapsed.",
        why: "The logic: the option holder already bought certainty; the offeror shouldn't bear mail-delay risk on top of it.",
      },
      {
        id: "c-hypo-death", type: "mcq",
        concept: "Termination — death of the offeror",
        scenario: "S offers in writing to sell B a boat, 'offer open for two weeks.' One week in, S dies. B — unaware of the death — mails an acceptance within the two weeks. Contract?",
        options: [
          "Yes — B accepted within the stated window without knowledge of the death",
          "No — death of the offeror terminates the offer, even without notice to the offeree",
          "Yes — the offer binds S's estate for the full two weeks",
          "No — but only because boats require a signed writing",
        ],
        correct: 1,
        explanation: "The fifth termination method: death of the offeror means the death of the offer — knowledge is irrelevant, because there is no longer a mind to meet. (Distinguish a paid-for OPTION, which can survive death and bind the estate.)",
        why: "Compare Mellish's analogy in Dickinson: accepting after learning the property was sold is as impossible as accepting after the offeror dies.",
      },
      {
        id: "c-hypo-request", type: "mcq",
        concept: "Conditional acceptance vs. mere request — § 61",
        scenario: "Responding to an offer to sell a house, buyer writes: 'I accept your offer and enclose the signed agreement and deposit. Also — would you consider leaving the patio furniture? Either way, we are moving forward.' Seller ignores it and sells elsewhere. Contract?",
        options: [
          "No — mentioning the furniture made this a counteroffer under the mirror image rule",
          "Yes — the acceptance was unequivocal; the furniture line was a mere request that the acceptance did not depend on",
          "No — an acceptance must repeat the offer's terms verbatim",
          "Yes — but only if the seller responds to the furniture question",
        ],
        correct: 1,
        explanation: "Restatement § 61: an acceptance requesting a change isn't invalidated unless it's made to DEPEND on assent to the change. 'Either way, we are moving forward' is exactly the unconditional language Ardente's letter lacked — Ardente sought 'confirmation' the items were 'part of the transaction,' which read as a condition.",
        why: "Same fact family as Ardente, flipped by one sentence — the exam move is quoting the language that shows (un)conditionality.",
      },
      {
        id: "c-hypo-subordinate", type: "mcq",
        concept: "Restitution is subordinate to contracts",
        scenario: "Homeowner signs a $5,000 written contract with a painter. The painter performs fully, then discovers comparable jobs go for $8,000 and sues in unjust enrichment for the $3,000 difference. Result?",
        options: [
          "Painter recovers $3,000 — the homeowner was enriched by below-market work",
          "Painter recovers nothing extra — restitution is subordinate to contracts; the valid contract fixes the recovery at its price",
          "Painter recovers $8,000 in quantum meruit and forfeits the contract price",
          "Painter recovers if he proves the homeowner knew the market rate",
        ],
        correct: 1,
        explanation: "Restitution is SUBORDINATE to contracts: where a valid contract governs the exact benefit conferred, unjust enrichment is unavailable to rewrite the bargain. The 'enrichment' has an adequate legal basis — the contract — so it isn't unjust(ified).",
        why: "The Restatement (Third)'s framing from your outline: restitution targets enrichment that LACKS an adequate legal basis.",
      },
      {
        id: "c-hypo-mower", type: "mcq",
        concept: "Unjust enrichment — volunteer / forced exchange",
        scenario: "While a homeowner is on vacation, a landscaper mows the badly overgrown lawn uninvited, then bills $200 — genuinely improving the property's look. Must the homeowner pay?",
        options: [
          "Yes — a real benefit was conferred and retained",
          "No — an unrequested benefit voluntarily conferred creates no compensation obligation, and the homeowner can't be forced into a purchase she never chose",
          "Yes — but only the fair market value of the mowing",
          "No — unless the landscaper mows a second time",
        ],
        correct: 1,
        explanation: "Both element-two exceptions fire: the landscaper gratuitously chose to confer a benefit instead of contracting (volunteer), and the homeowner received unrequested services she wouldn't necessarily have bought at market value (forced exchange). Element one is satisfied — the lawn IS better — but retention isn't unjust.",
        why: "Same skeleton as the professor's lumberjack pattern — good deed, no debt.",
      },
      {
        id: "c-hypo-quote", type: "mcq",
        concept: "Quotations — the Fairmount pattern",
        scenario: "Buyer emails: 'What is your best price on 500 units of part #77, delivered to Tampa?' Seller replies: 'Part #77: $4.00/unit delivered Tampa, for immediate acceptance, shipment by June 1.' Buyer replies: 'Accepted — 500 units.' Seller refuses, calling its email 'just a quote.' Contract?",
        options: [
          "No — price quotations are never offers (Moulton)",
          "Yes — a quote answering a specific inquiry, with quantity supplied by the inquiry and 'for immediate acceptance' language, is an offer",
          "No — the buyer's reply was the first offer, which the seller never accepted",
          "Yes — all commercial emails are binding offers",
        ],
        correct: 1,
        explanation: "The Fairmount pattern: the seller's response wasn't a general circular (Moulton) — it answered a SPECIFIC inquiry that fixed the quantity, and 'for immediate acceptance' invited assent to conclude the deal. Labeling it a 'quote' doesn't control; the objective features do.",
        why: "The Moulton → Fairmount → Nordyne line in one hypo: context, specificity, and acceptance-inviting language flip a quote into an offer.",
      },
    ],
  },
  torts: {
    name: "Torts",
    cards: [
      {
        id: "t-intent", type: "cloze",
        concept: "Battery intent — Garratt v. Dailey",
        text: "Intent is satisfied by acting with the {{purpose}} of causing the contact, or with knowledge to a {{substantial}} {{certainty}} that the contact will result.",
        why: "Age and mental capacity go only to whether the actor COULD hold that knowledge — Garratt (age five), Wagner (mental disability). Neither status defeats intent by itself.",
      },
      {
        id: "t-wagner", type: "flash",
        concept: "Capacity — Wagner v. State",
        prompt: "Does mental disability defeat the intent element of battery?",
        answer: [
          "No. Battery requires only intent to make the contact —",
          "not intent to harm, and not understanding that the act is wrong.",
          "A mentally disabled actor can form that intent.",
        ],
        fallback: "Only intent to {{contact}} is required — not intent to {{harm}}, and not understanding of wrongfulness.",
        why: "Pairs with Garratt: two kinds of incapacity, one intent standard.",
      },
      {
        id: "t-fisher", type: "flash",
        concept: "Battery — Fisher v. Carrousel",
        prompt: "Is touching the plaintiff's body required for battery?",
        answer: [
          "No. Contact with anything so closely identified with the body",
          "as to be customarily regarded as part of the person (a plate in the hand) suffices.",
          "Battery protects personal dignity, not just skin.",
        ],
        fallback: "Contact with an object closely {{identified}} with the body counts; battery protects personal {{dignity}}.",
        why: "Plate snatched from Fisher's hand — no skin contact, still battery.",
      },
      {
        id: "t-assault", type: "flash",
        concept: "Assault — Western Union v. Hill",
        prompt: "Assault: actual ability or apparent ability to complete the contact?",
        answer: [
          "Apparent ability is enough, judged from a reasonable person's view.",
          "Actual ability to complete the touching is NOT required.",
        ],
        fallback: "{{apparent}} ability is enough; {{actual}} ability is not required.",
        why: "The counter may have physically stopped Sapp from reaching Mrs. Hill — irrelevant, because it reasonably appeared he could.",
      },
      {
        id: "t-fi", type: "flash",
        concept: "False imprisonment — Big Town + Parvi",
        prompt: "False imprisonment: the rule, plus Parvi's refinement about awareness?",
        answer: [
          "Direct restraint of another's physical liberty without adequate legal justification (Big Town).",
          "The plaintiff must be conscious of the confinement AT THE TIME (or harmed by it) —",
          "but need not remember it later (Parvi).",
        ],
        fallback: "Restraint of physical {{liberty}} without legal {{justification}}; the victim must be {{conscious}} of it at the time, or harmed by it.",
        why: "Parvi was drunk and remembered nothing — but memory later ≠ awareness at the time. Jury question.",
      },
      {
        id: "t-iied", type: "flash",
        concept: "IIED — Harris v. Jones",
        prompt: "IIED: the four elements?",
        answer: [
          "1) Intentional or reckless conduct",
          "2) Extreme and outrageous",
          "3) Causal connection between conduct and distress",
          "4) The emotional distress must be severe",
        ],
        fallback: "1) {{intentional}} or reckless 2) {{extreme}} and outrageous 3) a {{causal}} connection 4) the distress must be {{severe}}.",
        why: "Harris proved the mocking but lost on element four — severity is a high bar, and vague evidence won't clear it.",
      },
      {
        id: "t-transfer", type: "flash",
        concept: "Transferred intent — Talmage v. Smith",
        prompt: "Transferred intent: what transfers, and where does it stop?",
        answer: [
          "Intent to commit a tort against A transfers when the act injures B instead.",
          "Works among: battery, assault, false imprisonment, trespass to land, trespass to chattels.",
          "Limit: it does NOT reach a bystander's IIED claim where the defendant didn't know the bystander was present (Taylor v. Vallelunga).",
        ],
        fallback: "Intent aimed at {{A}} transfers to injured {{B}} — but not to an unknown {{bystander}}'s IIED claim.",
        why: "Talmage: stick thrown at one boy, hits another — liable. Taylor: daughter secretly watching her father's beating — no IIED without directed intent.",
      },
      {
        id: "t-mcq-stick", type: "mcq",
        concept: "Transferred intent",
        scenario: "D throws a rock to scare trespasser A off his shed; it misses and blinds bystander B, whom D never saw. Battery against B?",
        options: [
          "No — D had no intent toward B",
          "Yes — transferred intent supplies the intent element",
          "No — B assumed the risk by standing nearby",
          "Yes — but only as negligence, not battery",
        ],
        correct: 1,
        explanation: "Talmage v. Smith: intent to commit unlawful contact against A transfers to B, the person actually struck. D can't escape liability because he hit the wrong target.",
        why: "You don't need intent toward the specific victim — just intent to commit the tort against someone.",
      },
      {
        id: "t-mcq-crowd", type: "mcq",
        concept: "Offensive contact in context",
        scenario: "During a fire drill in a packed stairwell, a teacher taps a parent's back with her fingertips to get her attention over the alarm. The parent falls and sues for battery. Best analysis?",
        options: [
          "Battery — any unconsented touch qualifies",
          "No battery — ordinary contact in a crowded setting isn't offensive unless rude, insolent, or angry",
          "No battery — school employees are immune",
          "Battery — because injury resulted, intent is presumed",
        ],
        correct: 1,
        explanation: "Wallace v. Rosen: some contact is part of the ordinary give-and-take of crowded life. Offensiveness is judged by an ordinary person, not one unduly sensitive about dignity — and context (emergency, alarm, crowd) matters.",
        why: "Battery's 'offensive' element is contextual, not absolute.",
      },
    ],
  },

  civpro: {
    name: "Civil Procedure",
    cards: [
      {
        id: "cp-1332", type: "cloze",
        concept: "Diversity statute — 28 U.S.C. § 1332(a)",
        text: "The district courts have original jurisdiction where the matter in controversy exceeds {{$75,000}}, exclusive of {{interest}} and {{costs}}, and is between citizens of different {{states}}.",
        why: "The two pillars of diversity jurisdiction: complete diversity + amount in controversy. Both must be satisfied.",
      },
      {
        id: "cp-complete-div", type: "cloze",
        concept: "Complete diversity",
        text: "Complete diversity requires that no {{plaintiff}} be a citizen of the same state as any {{defendant}}; shared citizenship on the {{same}} side of the v. is fine.",
        why: "π-NJ + π-NJ vs. Δ-NY + Δ-NY works. One NY plaintiff against one NY defendant kills it. A judge who notices the defect must dismiss sua sponte — no motion needed.",
      },
      {
        id: "cp-domicile", type: "cloze",
        concept: "Citizenship — natural person",
        text: "A natural person is a citizen of the state of her domicile — her {{true}}, {{fixed}}, and {{permanent}} home. Every person has exactly {{one}} domicile, never more.",
        why: "A child takes the parents' domicile until majority/emancipation. A U.S. citizen domiciled abroad is 'stateless' — neither a state citizen nor an alien, so no diversity OR alienage jurisdiction (Friedrich v. Davis).",
      },
      {
        id: "cp-nerve", type: "cloze",
        concept: "Corporate PPB — Harrison v. Granite Bay",
        text: "A corporation's principal place of business is found by the {{nerve}} {{center}} test — the place where officers {{direct}}, control, and coordinate the corporation's activities.",
        why: "Where the decisions are made, not where operations happen. Granite Bay's group homes were in Maine, but its officers decided from Concord, NH → PPB = NH.",
      },
      {
        id: "cp-caps", type: "flash",
        concept: "Exclusive federal SMJ — CAPS",
        prompt: "Which claims fall within EXCLUSIVE federal subject matter jurisdiction? (the mnemonic)",
        answer: [
          "C — Copyright",
          "A — Anti-trust",
          "P — Patent infringement",
          "S — Securities",
          "Everything else a state court can hear.",
        ],
        fallback: "{{Copyright}}, {{Anti}}-trust, {{Patent}} infringement, {{Securities}} — 'CAPS'.",
        why: "Most federal claims (e.g., Title VII) are CONCURRENT — either court system. CAPS claims are the narrow federal-only carve-out.",
      },
      {
        id: "cp-gen-lim", type: "flash",
        concept: "General vs. limited SMJ",
        prompt: "Why are state courts called courts of GENERAL SMJ and federal courts courts of LIMITED SMJ?",
        answer: [
          "State courts can hear nearly any claim — all state law claims, plus all federal claims except the exclusive (CAPS) set. Always available: the catch-all.",
          "Federal courts hear only a limited subset — all federal law claims, but state law claims only when diversity requirements are met.",
        ],
        fallback: "State courts hear {{any}} claim outside exclusive SMJ; federal courts hear all {{federal}} claims but state claims only through {{diversity}}.",
        why: "Professor's 'default SMJ': there is always a state court for your claim even when federal court is closed to you.",
      },
      {
        id: "cp-corp", type: "flash",
        concept: "Citizenship — corporation",
        prompt: "A corporation is a citizen of which state(s)?",
        answer: [
          "1) Every state in which it is incorporated (can be more than one), AND",
          "2) The one state of its principal place of business — found by the nerve center test.",
          "BOTH citizenships count when testing complete diversity.",
        ],
        fallback: "Every state of {{incorporation}} plus the state of its principal place of {{business}} — located at its {{nerve}} center.",
        why: "The dual citizenship is the trap: a DE-incorporated corporation with a NY nerve center kills diversity against ANY New York opponent (professor's slide hypo).",
      },
      {
        id: "cp-members", type: "flash",
        concept: "Citizenship — partnership / LLC / union",
        prompt: "Partnerships, LLCs, and labor unions: citizens of which state(s)?",
        answer: [
          "Every state in which ANY partner or member is a citizen.",
          "One member in the wrong state destroys complete diversity.",
          "Unlike corporations, there is no PPB rule here — membership is everything.",
        ],
        fallback: "Every state in which any {{partner}} or {{member}} is a citizen — no principal place of {{business}} rule applies.",
        why: "The classic exam trick is treating an LLC like a corporation. It isn't — an LLC with members in ten states is a citizen of all ten.",
      },
      {
        id: "cp-legalrep", type: "flash",
        concept: "Citizenship — legal representative",
        prompt: "A legal representative (of a decedent, infant, or incompetent) is a citizen of which state?",
        answer: [
          "The state of the REPRESENTED person — not the representative's own state.",
          "§ 1332(c)(2): the representative is 'deemed' a citizen only of the represented person's state.",
        ],
        fallback: "The state of the {{represented}} person only — the representative's {{own}} citizenship is ignored.",
        why: "Professor's hypo: a Georgia executor for a Florida decedent is a citizen of FLORIDA for diversity purposes.",
      },
      {
        id: "cp-timing", type: "flash",
        concept: "Timing of citizenship",
        prompt: "When is a party's citizenship determined — and which changes count?",
        answer: [
          "At the moment the lawsuit is commenced.",
          "Pre-commencement changes count, regardless of motive (can create or destroy diversity).",
          "Post-commencement changes never count (cannot create or destroy diversity).",
        ],
        fallback: "Citizenship is fixed at {{commencement}}; {{pre}}-commencement changes count regardless of motive; {{post}}-commencement changes never do.",
        why: "A defendant can't escape a judge it dislikes by relocating its PPB mid-case — and a plaintiff who genuinely moves before filing manufactures diversity legitimately (motive alone isn't disqualifying).",
      },
      {
        id: "cp-change-dom", type: "flash",
        concept: "Changing domicile — Ceglia v. Zuckerberg",
        prompt: "How does a natural person change domicile, and how do courts verify it?",
        answer: [
          "1) Physical presence in the new state (crossing the line counts), AND",
          "2) Intent to make it her true, fixed, permanent home.",
          "Courts test intent with objective evidence: residence, real/personal property, bank accounts, voter registration, employment, driver's license, tax payments.",
        ],
        fallback: "{{physical}} presence in the new state plus {{intent}} to make it the true, fixed, permanent home — proven by {{objective}} evidence.",
        why: "Both prongs must coincide. Saying you've moved isn't enough; the paper trail decides (Ceglia).",
      },
      {
        id: "cp-stateless", type: "flash",
        concept: "Stateless citizen — Friedrich v. Davis",
        prompt: "A U.S. citizen domiciled abroad is a party. Diversity? Alienage?",
        answer: [
          "Neither. A U.S. citizen domiciled abroad is not a citizen of any state (no state domicile) — and is not an alien (still a U.S. citizen).",
          "'Stateless' — their presence defeats both diversity AND alienage jurisdiction.",
        ],
        fallback: "A U.S. citizen domiciled {{abroad}} is not a citizen of a state nor an {{alien}} — '{{stateless}}' — so there can be neither diversity nor alienage jurisdiction.",
        why: "Friedrich v. Davis. A stateless party fits no § 1332 category, so the whole configuration fails.",
      },
      {
        id: "cp-evidence", type: "flash",
        concept: "Objective evidence of domicile — Ceglia",
        prompt: "Courts test a claimed domicile change with objective evidence. Name at least five kinds.",
        answer: [
          "Physical residence · personal and real property · bank and brokerage accounts · voter registration · employment · driver's license and auto registration · payment of taxes.",
        ],
        fallback: "Physical {{residence}}, real and personal {{property}}, bank and brokerage accounts, {{voter}} registration, employment, driver's {{license}} and auto registration, and payment of {{taxes}}.",
        why: "Ceglia v. Zuckerberg — the paper trail decides intent, not the party's say-so.",
      },
      {
        id: "cp-aic-test", type: "flash",
        concept: "AIC — good faith & legal certainty",
        prompt: "The amount in controversy standard: whose number controls, and what's the test?",
        answer: [
          "Must EXCEED $75,000, exclusive of interest and costs.",
          "The plaintiff's good-faith allegation controls — unless it appears to a legal certainty the amount cannot be recovered.",
          "Recovering less than $75,000 later does NOT defeat jurisdiction (AIC is measured at commencement).",
          "Exam rule for injunctions: satisfied if EITHER side's valuation exceeds $75,000.",
        ],
        fallback: "Plaintiff's {{good}}-faith allegation controls unless it appears to a legal {{certainty}} the amount cannot be recovered; recovery below the minimum {{after}} commencement does not defeat jurisdiction.",
        why: "$75,000.00 exactly fails — it must exceed. Punitive damages can carry a claim over the line.",
      },
      {
        id: "cp-aic-counts", type: "flash",
        concept: "AIC — what counts",
        prompt: "For the AIC: which of these count — pre-filing interest, post-filing interest, court costs, attorney fees, mitigated wages?",
        answer: [
          "Pre-filing interest: counts. Post-filing interest: does not.",
          "Costs (filing fees, court reporters, experts): do not count.",
          "Attorney fees: count only if recoverable under an exception to the American Rule.",
          "Mitigation subtracts: pre-commencement earnings from a new job reduce a lost-wages claim (Bush v. Roadway).",
        ],
        fallback: "{{pre}}-filing interest counts; post-filing interest and {{costs}} do not; attorney fees count only under an exception to the {{American}} Rule; {{mitigation}} reduces the claim.",
        why: "Bush also teaches burden: the party invoking federal jurisdiction (there, the removing defendant) must prove the AIC when questioned — and Roadway wouldn't put a number on Bush's other damages for fear of setting a floor for trial.",
      },
      {
        id: "cp-alienage", type: "flash",
        concept: "Alienage jurisdiction",
        prompt: "Alienage: which configurations work, and which never do?",
        answer: [
          "Alien vs. U.S. citizen domiciled in a state: works (either side).",
          "LPRA vs. U.S. citizen: works — UNLESS the LPRA is domiciled in the same state as the opposing citizen.",
          "Alien vs. alien: NEVER — even two LPRAs domiciled in different states.",
          "Extra alien parties don't destroy jurisdiction so long as a fully diverse citizen pairing anchors the suit — but π(MEX) vs. Δ(MEX) + Δ(FL) fails until the foreign defendant is dropped.",
        ],
        fallback: "An alien vs. a {{citizen}} of a state = alienage jurisdiction; two {{aliens}} on opposite sides = never; an LPRA domiciled in the {{same}} state as the opposing citizen destroys it.",
        why: "§ 1332(a)(2): the LPRA same-state carve-out is statutory, not judge-made. And a U.S. citizen domiciled abroad fits nowhere — stateless (Friedrich).",
      },
      {
        id: "cp-exceptions", type: "flash",
        concept: "Exceptions to diversity jurisdiction",
        prompt: "The three exceptions to diversity jurisdiction — and the exam-flagged carve-out?",
        answer: [
          "Collusive joinder: courts ignore artificial claim assignments made solely to manufacture diversity (genuine unilateral moves are fine — motive alone isn't disqualifying).",
          "Domestic relations: divorce, alimony/support awards or modifications, and custody decrees ONLY — but a collection action for UNPAID support is NOT excluded. [Exam point]",
          "Probate: federal courts won't administer an estate or will directly — but CAN hear related tort/misconduct claims against administrators.",
        ],
        fallback: "The domestic relations exception covers {{divorce}}, support, and {{custody}} decrees — but does NOT bar {{collection}} actions for unpaid support; courts also disregard {{collusive}} joinder.",
        why: "The professor flagged the unpaid-support collection carve-out specifically for the exam.",
      },
      {
        id: "cp-realign", type: "flash",
        concept: "Realignment",
        prompt: "What is realignment, and why does it matter for diversity?",
        answer: [
          "The court may realign parties according to their ACTUAL interests, regardless of how the complaint labels them.",
          "Realignment can create or destroy complete diversity.",
        ],
        fallback: "The court aligns parties by their actual {{interests}}, not their labels — which can {{create}} or destroy diversity.",
        why: "Labels don't control; substance does. A 'defendant' whose interests track the plaintiff's gets moved across the v.",
      },
      {
        id: "cp-mcq-agg1", type: "mcq",
        concept: "Aggregation — Rule 1",
        scenario: "π (NJ) sues Δ (NY) in one lawsuit: negligence for $50,000 and breach of contract for $60,000. Is the amount in controversy satisfied?",
        options: [
          "No — each claim must independently exceed $75,000",
          "Yes — one plaintiff may aggregate all her claims against one defendant: $110,000",
          "No — tort and contract claims can never be combined",
          "Yes — but only because the claims arise from the same transaction",
        ],
        correct: 1,
        explanation: "Aggregation Rule 1: a single plaintiff adds together ALL her claims against a single defendant — related or not. $50k + $60k = $110k, AIC satisfied.",
        why: "One-on-one is the only free aggregation. Add a party on either side and the rules flip.",
      },
      {
        id: "cp-mcq-agg2", type: "mcq",
        concept: "Aggregation — Rules 2 & 3",
        scenario: "π (NJ) sues Δ-1 (NY) for negligence ($50,000) and Δ-2 (PA) for negligence ($60,000) in one lawsuit. AIC satisfied?",
        options: [
          "Yes — the total at stake is $110,000",
          "No — one plaintiff cannot aggregate claims against multiple defendants; neither claim clears $75,000",
          "Yes — as long as complete diversity exists",
          "No — negligence claims are capped at $75,000",
        ],
        correct: 1,
        explanation: "Aggregation Rule 2: no adding across defendants. Each defendant's exposure is measured separately, and neither $50k nor $60k exceeds $75k. (Rule 3 is the mirror: multiple plaintiffs can't combine against one defendant.)",
        why: "Exception: a JOINT claim (joint tortfeasors, jointly held rights) counts as one claim for its full value.",
      },
      {
        id: "cp-mcq-jsl", type: "mcq",
        concept: "AIC — joint & several liability",
        scenario: "Polly (FL) sues Daniel (GA) and Donald (SC) — jointly and severally liable — for $100,000 in one negligence action. Can she satisfy the AIC in federal court?",
        options: [
          "No — $100,000 split across two defendants is $50,000 each",
          "Yes — under joint and several liability, the claim against EACH defendant is for the full $100,000",
          "No — multiple defendants always defeat the AIC",
          "Yes — but only if each defendant's share independently exceeds $75,000",
        ],
        correct: 1,
        explanation: "Joint and several liability means Polly can collect the entire $100,000 from either defendant alone — so the amount in controversy against each is $100,000, even though she can only collect $100,000 in total.",
        why: "Joint claims are the carve-out from the no-aggregation rules: one claim, full value.",
      },
      {
        id: "cp-mcq-timing", type: "mcq",
        concept: "Post-commencement citizenship change",
        scenario: "ABC (DE + NY) sues DEF (CA + PPB Los Angeles) in federal court. Mid-case, after unfavorable rulings, DEF moves its principal place of business to New York and moves to dismiss for lack of complete diversity. Result?",
        options: [
          "Grant — complete diversity no longer exists",
          "Deny — citizenship is fixed at commencement; post-commencement changes cannot destroy diversity",
          "Grant — a corporation's citizenship follows its current PPB",
          "Deny — but only because DEF's motive was improper",
        ],
        correct: 1,
        explanation: "Citizenship is measured when the suit is commenced (DE+NY vs. CA). Post-commencement changes never create or destroy diversity — motive is irrelevant, timing is everything.",
        why: "Flip side: a genuine pre-commencement move counts even if made precisely to create diversity.",
      },
      {
        id: "cp-mcq-injunction", type: "mcq",
        concept: "AIC — valuing an injunction",
        scenario: "Peter (NY) seeks an injunction forcing Danielle (CT) to lower her beach house. Success raises Peter's home value by $50,000; compliance costs Danielle $250,000. For exam purposes, is the AIC satisfied?",
        options: [
          "No — the plaintiff's viewpoint controls, and $50,000 falls short",
          "Yes — the AIC is satisfied if EITHER party's valuation exceeds $75,000",
          "No — injunctions have no monetary value for AIC purposes",
          "Yes — injunction cases are exempt from the AIC requirement",
        ],
        correct: 1,
        explanation: "Courts split on valuing injunctions, but the exam rule per the professor: the AIC is satisfied when the value from EITHER the plaintiff's or the defendant's perspective exceeds $75,000. Danielle's $250,000 compliance cost carries it.",
        why: "Know both views exist; apply the either-viewpoint rule on the exam.",
      },
      {
        id: "cp-mcq-alien", type: "mcq",
        concept: "Alienage — alien on both sides",
        scenario: "π (citizen of Mexico) sues Δ-1 (citizen of Mexico) and Δ-2 (U.S. citizen, FL) on a state law claim for $200,000. Alienage jurisdiction?",
        options: [
          "Yes — an alien versus a U.S. citizen always supports alienage jurisdiction",
          "No — aliens appear on both sides of the v.; but dropping the Mexican defendant would cure it",
          "Yes — additional foreign parties never affect jurisdiction",
          "No — alienage jurisdiction requires all parties to be U.S. citizens",
        ],
        correct: 1,
        explanation: "Alienage never exists between two aliens — and here aliens sit on both sides. Extra alien parties are tolerated only when a fully diverse pairing anchors the suit. Drop Δ-1, and π(MEX) vs. Δ(FL) is a clean § 1332(a)(2) case.",
        why: "Check every party's status before calling it alienage — one alien opposite another poisons the configuration.",
      },
      {
        id: "cp-mcq-caps", type: "mcq",
        concept: "Exclusive SMJ — professor's Sherman Act hypo",
        scenario: "Polly (FL) sues Daniel (FL) for violating the Sherman Act, 15 U.S.C. § 1 (federal antitrust). Where can this claim be heard?",
        options: [
          "State court only — the parties aren't diverse",
          "Federal court only — antitrust falls within exclusive federal SMJ (CAPS)",
          "Either court — most federal claims are concurrent",
          "Neither court — no diversity and no AIC alleged",
        ],
        correct: 1,
        explanation: "Antitrust is the A in CAPS — one of the few claims exclusively vested in federal courts. Diversity is irrelevant: this is federal question territory, and same-state parties don't matter.",
        why: "Spot the exclusive-SMJ claims first; diversity analysis never even starts for CAPS claims.",
      },
      {
        id: "cp-mcq-concurrent", type: "mcq",
        concept: "Concurrent SMJ — professor's Title VII hypo",
        scenario: "Polly (FL) sues Daniel (FL) and ABC Corp under Title VII of the Civil Rights Act (federal law). Which court(s) can hear it?",
        options: [
          "Federal only — all federal claims are exclusively federal",
          "Either — most federal law claims fall within the concurrent jurisdiction of both systems",
          "State only — the parties share Florida citizenship",
          "Neither — employment claims must go to an agency first",
        ],
        correct: 1,
        explanation: "Title VII is a federal claim, but NOT a CAPS claim — so it's concurrent: a state court (general SMJ) or a federal court (federal question) can hear it. Shared FL citizenship blocks diversity, but federal question jurisdiction doesn't need diversity.",
        why: "Exclusive is the narrow exception; concurrent is the norm for federal claims.",
      },
      {
        id: "cp-mcq-default", type: "mcq",
        concept: "Default SMJ — professor's $50k hypo",
        scenario: "Polly (FL) wants to sue Daniel (FL) for negligence, seeking $50,000. Which court(s) can hear the claim?",
        options: [
          "Either — negligence claims are concurrent",
          "State court only — same-state parties AND an amount under $75,000.01 each independently defeat diversity",
          "Federal court only — car accidents involve federal highways",
          "State court only — but solely because of the dollar amount",
        ],
        correct: 1,
        explanation: "This is the professor's 'default SMJ' scenario: a state law claim that CANNOT enter federal court because diversity fails twice over — no diverse citizenship and no sufficient AIC. State court is the catch-all that always remains.",
        why: "Either defect alone kills diversity; here there are two.",
      },
      {
        id: "cp-mcq-corpdiv", type: "mcq",
        concept: "Complete diversity — corporate plaintiff",
        scenario: "π-1 (a corporation incorporated in DE with its PPB in NY), π-2 (NJ), π-3 (AL) sue Δ-1 (NY), Δ-2 (NY), Δ-3 (TX). Complete diversity?",
        options: [
          "Yes — π-1 is a Delaware corporation, and no other plaintiff overlaps",
          "No — π-1 is ALSO a citizen of NY (its PPB), overlapping with Δ-1 and Δ-2",
          "Yes — corporate citizenship is only tested where incorporated",
          "No — multiple defendants from the same state defeat diversity by themselves",
        ],
        correct: 1,
        explanation: "Both corporate citizenships count. π-1 is a citizen of DE AND NY — and NY defendants sit across the v. Complete diversity fails. (Same-side overlaps, like the two NY defendants, are always fine.)",
        why: "Straight from the professor's Class One slides — always run the corporation's second citizenship.",
      },
      {
        id: "cp-mcq-suasponte", type: "mcq",
        concept: "Sua sponte dismissal",
        scenario: "Peter (NY) sues Danielle (NY) in federal court on a $200,000 state law contract claim. Neither party objects to jurisdiction, but the judge notices the shared citizenship. What must the judge do?",
        options: [
          "Nothing — objections to jurisdiction are waived if not raised",
          "Dismiss for lack of SMJ, even without any motion — federal judges must police their own jurisdiction",
          "Transfer the case to state court automatically",
          "Proceed, but flag the issue for appeal",
        ],
        correct: 1,
        explanation: "The Constitution and § 1332 limit federal SMJ, so federal judges are obligated to police it themselves. A judge who notices the defect must dismiss sua sponte — party silence can't create jurisdiction that doesn't exist.",
        why: "SMJ can never be waived, stipulated, or consented into existence.",
      },
      {
        id: "cp-mcq-verdict", type: "mcq",
        concept: "AIC — measured at commencement",
        scenario: "Peter (NY) sues Danielle (CT) in federal court alleging $200,000 in contract damages. The jury awards only $25,000. Danielle immediately moves to dismiss for lack of SMJ. Result?",
        options: [
          "Grant — the recovery proves less than $75,000 was ever in controversy",
          "Deny — AIC is measured at commencement from the plaintiff's good-faith allegation; a smaller verdict changes nothing",
          "Grant — but Peter keeps the $25,000",
          "Deny — but only because Danielle waited until after trial",
        ],
        correct: 1,
        explanation: "The AIC is fixed at the moment of filing, based on a good-faith allegation. Recovering less later — even far less — does not retroactively strip jurisdiction. The legal-certainty test is applied looking forward from filing, not backward from the verdict.",
        why: "Timing symmetry with citizenship: both jurisdiction inputs lock at commencement.",
      },
      {
        id: "cp-hypo-llc", type: "mcq",
        concept: "LLC vs. corporation citizenship trap",
        scenario: "An LLC with two members (one domiciled in FL, one in GA) sues a corporation incorporated in DE with its nerve center in FL, for $500,000. Complete diversity?",
        options: [
          "Yes — the LLC is a citizen of its state of organization only",
          "No — the LLC is a citizen of FL and GA (every member), the corporation of DE and FL — Florida sits on both sides",
          "Yes — LLCs take only their principal place of business",
          "No — LLCs can never invoke diversity jurisdiction",
        ],
        correct: 1,
        explanation: "The classic trap: an LLC takes EVERY member's citizenship (no PPB rule), while a corporation takes incorporation + nerve center. FL appears on both sides of the v. — complete diversity fails.",
        why: "Run entity citizenship rules separately for each side before comparing; never treat an LLC like a corporation.",
      },
      {
        id: "cp-hypo-exec", type: "mcq",
        concept: "Legal representative citizenship",
        scenario: "A Georgia resident serving as executor of a Florida decedent's estate sues a Florida defendant in federal court for $200,000. Diversity?",
        options: [
          "Yes — the executor is a Georgia citizen suing a Florida citizen",
          "No — under § 1332(c)(2), the executor is deemed a citizen only of Florida (the decedent's state), so both sides are Floridian",
          "Yes — estates are citizens of every state where estate property sits",
          "No — estates can never sue in federal court",
        ],
        correct: 1,
        explanation: "§ 1332(c)(2): a legal representative takes ONLY the represented person's citizenship — the executor's own Georgia domicile is ignored. FL vs. FL, no diversity. This is the professor's exact hypo with the parties put in suit posture.",
        why: "Also blocks manufacturing diversity by hand-picking an out-of-state representative.",
      },
      {
        id: "cp-hypo-stateless", type: "mcq",
        concept: "Stateless member poisons the entity",
        scenario: "A partnership's three partners are domiciled in TX, OK — and one is a U.S. citizen domiciled in Paris. The partnership sues a NY corporation for $1M in federal court. Diversity?",
        options: [
          "Yes — TX/OK vs. NY is completely diverse; ignore the partner abroad",
          "No — the U.S.-citizen partner domiciled abroad is stateless, and the partnership takes every partner's status — no diversity configuration is possible",
          "Yes — the Paris partner counts as a French citizen, creating alienage",
          "No — partnerships cannot sue in federal court",
        ],
        correct: 1,
        explanation: "Chain two rules: a U.S. citizen domiciled abroad is stateless (Friedrich) — neither a state citizen nor an alien — and a partnership carries EVERY partner's citizenship. One stateless partner makes the entity un-diverse against anyone; the suit belongs in state court.",
        why: "Friedrich + the member rule stacked — exactly the kind of two-rule chain essay exams reward.",
      },
      {
        id: "cp-hypo-lpra", type: "mcq",
        concept: "Alienage — the LPRA carve-out",
        scenario: "A citizen of Brazil, lawfully admitted for permanent residence (green card) and domiciled in Florida, sues a U.S. citizen domiciled in Florida for $100,000. Alienage jurisdiction?",
        options: [
          "Yes — an alien versus a U.S. citizen is the core alienage case",
          "No — § 1332(a)(2)'s carve-out: no jurisdiction between a foreign citizen admitted for permanent residence and a U.S. citizen domiciled in the SAME state",
          "Yes — green card holders are treated as U.S. citizens",
          "No — Brazilians cannot sue in U.S. courts",
        ],
        correct: 1,
        explanation: "The statutory exception written into § 1332(a)(2): an LPRA domiciled in the same U.S. state as the opposing citizen destroys alienage jurisdiction. Move either party's domicile to Georgia and the suit works.",
        why: "The carve-out is statutory text, not case law — quote it as such.",
      },
      {
        id: "cp-hypo-move", type: "mcq",
        concept: "Pre-commencement move made to create diversity",
        scenario: "Three weeks before filing against a Texas defendant, P moves from Texas to Oklahoma specifically so she can sue in federal court — new apartment, new job, OK driver's license, voter registration, bank accounts. She then files. Does diversity exist?",
        options: [
          "No — a move motivated by creating diversity is collusive and ignored",
          "Yes — a GENUINE pre-commencement domicile change counts regardless of motive; the objective evidence shows real intent to remain",
          "No — she must live in Oklahoma at least one year first",
          "Yes — but only if the defendant consents",
        ],
        correct: 1,
        explanation: "Two rules cooperating: citizenship is fixed at commencement, and pre-commencement changes count REGARDLESS of reason — motive alone is not disqualifying (that's the collusive-joinder doctrine's own limit; it targets artificial claim ASSIGNMENTS, not genuine unilateral moves). The Ceglia-style objective evidence proves the change is real.",
        why: "Distinguish: assigning a claim to an out-of-state strawman = collusive; actually moving your life = allowed.",
      },
      {
        id: "cp-hypo-nerve", type: "mcq",
        concept: "Nerve center vs. operations",
        scenario: "A corporation runs all its factories in Ohio, where 95% of employees work — but its officers set policy and direct operations from a small headquarters in New York. Incorporated in Delaware. Its citizenships?",
        options: [
          "DE and OH — the principal place of business is where the business mostly happens",
          "DE and NY — the nerve center test locates the PPB where officers direct, control, and coordinate, not where operations occur",
          "OH only — most employees controls",
          "DE, OH, and NY — corporations take every state where they operate",
        ],
        correct: 1,
        explanation: "Harrison v. Granite Bay: the nerve center is the place of direction and decision — the brain, not the muscle. Heavy operations in Ohio don't move the PPB from the New York headquarters. Exactly one PPB, plus every state of incorporation.",
        why: "Watch for facts that dangle a big-operations state as bait — the test asks where decisions are made.",
      },
      {
        id: "cp-hypo-support", type: "mcq",
        concept: "Domestic relations — the collection carve-out",
        scenario: "After a state-court divorce, P (now domiciled in GA) sues her ex-spouse (FL) in federal court to COLLECT $150,000 in unpaid, already-awarded child support. The ex moves to dismiss under the domestic relations exception. Result?",
        options: [
          "Dismiss — anything touching child support is a domestic relations matter",
          "Deny — the exception covers only issuing/modifying divorce, alimony, and custody decrees; a collection action for unpaid support proceeds in diversity",
          "Dismiss — family members can never be diverse",
          "Deny — but only if the state court certifies the question",
        ],
        correct: 1,
        explanation: "The exam-flagged carve-out: the domestic relations exception is narrow — divorce, alimony, and custody DECREES. A suit to collect a support debt already reduced to an award is an ordinary money claim; with GA vs. FL and $150,000, diversity is satisfied.",
        why: "Your outline literally tags this '[know for exam]' — the trap answer is over-reading the exception.",
      },
      {
        id: "cp-hypo-interest", type: "mcq",
        concept: "AIC — interest and costs arithmetic",
        scenario: "P sues a diverse defendant alleging $70,000 in contract damages, plus $6,000 in interest that accrued BEFORE filing, and expects $10,000 in filing fees and expert costs. Amount in controversy satisfied?",
        options: [
          "No — $70,000 in damages falls short and nothing else ever counts",
          "Yes — pre-filing interest counts toward the AIC: $70,000 + $6,000 = $76,000, exceeding $75,000 (costs never count)",
          "Yes — $70,000 + $10,000 in costs = $80,000",
          "No — interest of any kind is excluded by the statute",
        ],
        correct: 1,
        explanation: "The professor's split on 'exclusive of interest and costs': PRE-filing interest (part of the accrued claim) counts; post-filing interest and litigation costs (filing fees, court reporters, experts) never do. $76,000 exceeds — not merely equals — $75,000. AIC satisfied.",
        why: "Attorney fees are the third wrinkle: they count only when recoverable under an exception to the American Rule.",
      },
    ],
  },
};

/* ============================================================
   BLURT PROMPTS — free-recall / blank-page practice.
   {
     id, subject-scoped topic label,
     topic: "what to write about",
     components: ["each discrete point you should have produced"],
     model: ["model answer, one line per line"]
   }
   Add new ones by appending to the right subject array.
   ============================================================ */

const BLURTS = {
  contracts: [
    { id: "b-c-sources", topic: "Sources of contract law",
      components: ["Common law — judge-made, governs services", "Restatement (Second) of Contracts as the common-law guide", "UCC Article 2 — statutory, governs transactions in goods", "Threshold question: goods or services?"],
      model: ["Common law — judge-made, applies to services, organized for study by the Restatement (Second) of Contracts. UCC Article 2 — statutory, applies to transactions in goods.", "Characterize the subject matter first; the rules diverge (notably on the mirror image rule)."] },

    { id: "b-c-objective", topic: "Objective theory of contracts",
      components: ["Outward expression controls, not secret unexpressed intention", "Law imputes an intention matching the reasonable meaning of words and acts", "A private joke or reservation does not defeat a manifested agreement", "Unless a reasonable person would have recognized the joke"],
      model: ["We look to the outward expression of a person as manifesting his intention rather than to his secret and unexpressed intention; the law imputes an intention corresponding to the reasonable meaning of his words and acts (Lucy v. Zehmer).", "A private reservation — drunk, joking — does not defeat what the conduct manifested, unless a reasonable person in the other party's position would have understood it as a joke (contrast Leonard)."] },

    { id: "b-c-formation", topic: "Contract formation ingredients",
      components: ["Offer — one party offers a promise", "Acceptance — the other party accepts", "Offer + acceptance = meeting of the minds", "Consideration — bargained-for exchange"],
      model: ["Three ingredients: offer, acceptance (together the meeting of the minds), and consideration — a bargained-for exchange.", "Where one is missing, the workarounds are promissory estoppel and restitution."] },

    { id: "b-c-offer", topic: "Offer — definition",
      components: ["§ 24 — manifestation of willingness to enter into a bargain", "So made as to justify another in understanding assent is invited", "…and that assent will conclude it", "§ 26 — no offer if a further manifestation of assent is required", "Test: would 'I accept' create mutually binding obligations?"],
      model: ["Rest. § 24: an offer is the manifestation of willingness to enter into a bargain, so made as to justify another person in understanding that their assent to that bargain is invited and will conclude it.", "Rest. § 26 negative: no offer where the addressee knows or has reason to know the maker does not intend to conclude a bargain until making a further manifestation of assent.", "Working test: if 'I accept' would create mutually binding obligations, it is probably an offer."] },

    { id: "b-c-offerfactors", topic: "Offer — the eight factors",
      components: ["Finality", "Completeness", "Context", "Audience", "Jargon", "Method of acceptance", "Public policy / fairness", "Accepted practice", "None is dispositive"],
      model: ["Finality (willing to be bound on acceptance); completeness (substantially all contemplated terms); context (indicating hope for acceptance); audience (broad audience cuts against); jargon ('legally binding offer' language); method of acceptance specified; public policy and fairness (exploiting an ambiguity cuts against); accepted practice or course of dealing.", "None of these is necessarily dispositive — they are weighed, not counted."] },

    { id: "b-c-quotes", topic: "Price quotations — the rule",
      components: ["General rule — a quotation invites offers, it is not one", "Becomes an offer if assent alone would conclude the deal", "Factor — extent of prior inquiry", "Factor — completeness of terms", "Factor — number of recipients"],
      model: ["A price quotation is generally not an offer but a suggestion to induce offers. It becomes one if detailed enough that it reasonably appears assent to the quote is all that is needed to ripen it into a contract.", "Rest. § 26 cmt. c factors: the extent of prior inquiry, the completeness of the terms, and the number of persons to whom it was communicated."] },

    { id: "b-c-quotecases", topic: "Quotation cases compared",
      components: ["Moulton — unsolicited general circular, no quantity limit, not an offer", "Fairmount — answered a specific inquiry, 'for immediate acceptance' — offer", "Nordyne — months of negotiation, complete terms, one recipient, custom product — offer", "The variable is specificity plus acceptance-inviting language"],
      model: ["Moulton v. Kershaw: an unsolicited general trade letter ('we are authorized to offer') with no quantity limit is a solicitation, not an offer.", "Fairmount Glass Works: a quote responding to a specific inquiry, with quantity fixed by that inquiry and 'for immediate acceptance,' is an offer.", "Nordyne v. ICM: a negotiated, complete, single-recipient quotation for a custom product is an offer, accepted by the production sign-off."] },

    { id: "b-c-ads", topic: "Advertisements — the rule",
      components: ["Default — an ad invites offers, it is not one (Craft)", "Q1 — performance promised in positive terms for something requested", "Q2 — clear, definite, explicit, nothing open to negotiation", "Q3 — other facts showing intent to be bound"],
      model: ["Absent special circumstances, an advertisement is a mere invitation for the audience to make offers (Craft v. Elder & Johnston).", "Three questions: was performance promised in positive terms in return for something requested; is it clear, definite, and explicit, leaving nothing open for negotiation; and do other facts show the advertiser intended an offer."] },

    { id: "b-c-lefkowitz", topic: "Lefkowitz v. Great Minneapolis Surplus",
      components: ["Ad was clear, definite, explicit — nothing open to negotiation", "'First come, first served' identified who could accept", "Performance (being first, $1 in hand) was the acceptance", "A limiting mechanism caps acceptances at inventory", "House rules cannot be imposed after acceptance"],
      model: ["'Saturday 9 A.M. Sharp … 1 Black Lapin Stole … $1.00 First Come First Served' was clear, definite, and explicit, leaving nothing open for negotiation — so it was an offer, accepted by the plaintiff's performance in arriving first with the price.", "The limiting language also caps acceptances at inventory. An advertiser may modify before acceptance but may not impose new conditions (the 'women only' house rule) afterward."] },

    { id: "b-c-leonard", topic: "Leonard v. PepsiCo",
      components: ["Commercial deferred all terms to a separate catalog", "No limiting words — nothing capped the acceptances", "Objective reasonable viewer would perceive a joke", "The viewer's order form was itself the offer, never accepted"],
      model: ["The Harrier Jet commercial was not an offer: it was not self-contained (redemption terms lived in the separate catalog), it lacked any 'first come, first served'-type limitation, and no objective, reasonable person would have understood it as serious.", "Under the ordinary rule, Leonard's order form and check constituted the offer — which PepsiCo never accepted."] },

    { id: "b-c-accept", topic: "Acceptance — definition and mode",
      components: ["§ 50 — manifestation of assent in a manner invited or required", "By default, any reasonable manner is invited", "By promise — every act essential to making the promise", "By performance — at least part performed or tendered", "Ambiguous offer — either mode works"],
      model: ["Rest. § 50: acceptance is the manifestation of assent to the terms of the offer, made by the offeree in a manner invited or required by the offer. By default an offer invites acceptance in any reasonable manner.", "Acceptance by promise requires every act essential to making the promise; acceptance by performance requires at least part of the requested performance to be performed or tendered — mere preparation is insufficient. If the offer is ambiguous, either mode works."] },

    { id: "b-c-mirror", topic: "Mirror image rule",
      components: ["An acceptance changing a material term is a counteroffer", "A counteroffer operates as a rejection", "§ 59 — conditional on assent to different/additional terms = counteroffer", "§ 61 — a mere request for change does not invalidate", "…unless the acceptance is made to DEPEND on that change"],
      model: ["An acceptance that attempts to change a material term of the offer is a counteroffer, not an acceptance, and a counteroffer operates as a rejection.", "Rest. § 59: a reply purporting to accept but conditional on the offeror's assent to additional or different terms is a counter-offer. Rest. § 61: an acceptance that requests a change or addition is not invalidated unless the acceptance is made to depend on assent to it."] },

    { id: "b-c-ardente", topic: "Ardente v. Horan",
      components: ["Buyer signed and returned the agreement with a deposit", "Letter sought 'confirmation' the furnishings were 'part of the transaction'", "…and stressed the items would be difficult to replace", "Read as a condition, not a collateral request → counteroffer, no contract"],
      model: ["The plaintiff executed the purchase agreement and enclosed a deposit, but the accompanying letter asked the sellers to confirm that listed furnishings were part of the transaction and stressed they would be difficult to replace.", "Because the letter did not unequivocally state he would proceed either way, it imposed a condition rather than making a collateral request — converting the acceptance into a counteroffer, so no contract formed."] },

    { id: "b-c-notice", topic: "Notice of acceptance",
      components: ["No contract until acceptance is communicated to the offeror", "An uncommunicated intention to accept is not an acceptance", "Where the offer calls for a promise, notice is always essential", "Notice to an agent within authority is notice to the principal"],
      model: ["There is no contract until acceptance is communicated to the offeror; an uncommunicated intention to accept is not an acceptance, and a mere private act of the offeree does not suffice. Where the offer calls for a promise rather than an act, notice of acceptance is always essential (Hendricks v. Behee).", "Notice to an agent, within the scope of the agent's authority, is notice to the principal — which is why revocation delivered to the sellers' agent beat their signed but uncommunicated acceptance."] },

    { id: "b-c-mailbox", topic: "Mailbox rule — the basic rule",
      components: ["§ 63(a) — acceptance operative when put out of the offeree's control", "Unless the offer provides otherwise", "Effective even if it never reaches the offeror", "Morrison v. Thoelke — complete on mailing, barring later repudiation"],
      model: ["Rest. § 63(a): unless the offer provides otherwise, an acceptance made in a manner and by a medium invited by the offer is operative and completes the manifestation of mutual assent as soon as it is put out of the offeree's control, without regard to whether it ever reaches the offeror.", "Morrison v. Thoelke: the contract is complete on mailing, which bars repudiation before delivery."] },

    { id: "b-c-mailbox2", topic: "Mailbox rule — receipt and overtaking",
      components: ["Dispatch timing applies ONLY to first-move acceptances", "Revocations are effective on receipt", "Rejections are effective on receipt", "An acceptance sent after a rejection is only a counteroffer unless it arrives first", "Option contracts excepted — exercise effective on receipt"],
      model: ["The dispatch rule applies only to first-move acceptances. Revocations, rejections, and second-move acceptances are effective only upon actual receipt.", "Overtaking: a mailed rejection does not terminate the power of acceptance until received, but an acceptance dispatched after a rejection is only a counteroffer unless it reaches the offeror before the rejection does.", "Options are excepted — an exercise must be received within the option period."] },

    { id: "b-c-term", topic: "Termination of the offer — five ways",
      components: ["Rejection", "Revocation at any time before acceptance", "Counteroffer (a conditional acceptance can be one)", "Lapse of time — reasonable time or the time stated", "Death of the offeror"],
      model: ["Five ways: rejection, which ends the acceptability of the offer; revocation at any time prior to acceptance; counteroffer, which operates as a rejection (and a conditional acceptance can be a counteroffer); lapse of time, either a reasonable time or the time provided in the offer; and death of the offeror — the death of the offeror is the death of the offer.", "After termination the offer cannot be accepted."] },

    { id: "b-c-43", topic: "Revocation through action (§ 43)",
      components: ["Power of acceptance ends on definite inconsistent action", "…plus the offeree acquiring reliable information of it", "No formal revocation notice from the offeror required", "Dickinson v. Dodds — buyer knew of the sale to Allan before 'accepting'", "The minds must meet at the moment of acceptance"],
      model: ["Rest. § 43: an offeree's power of acceptance is terminated when the offeror takes definite action inconsistent with an intention to enter into the proposed contract and the offeree acquires reliable information to that effect.", "Dickinson v. Dodds: told by a third party that Dodds had sold to Allan, Dickinson could no longer accept — 'it is impossible to say there was ever that existence of the same mind between the two parties which is essential in point of law to the making of an agreement.'"] },

    { id: "b-c-option", topic: "Option contracts",
      components: ["A bare promise to hold an offer open is a nudum pactum", "Consideration paid for irrevocability creates a true option", "An option is irrevocable for its stated term", "Option acceptances are effective on receipt, not dispatch"],
      model: ["A promise to hold an offer open, unsupported by consideration, is a nudum pactum and does not bind — the offeror may still revoke (Dickinson v. Dodds).", "Where consideration is given for the promise of irrevocability, a true option contract exists and the offer cannot be revoked during its term. Note the timing wrinkle: the mailbox rule does not apply, so an exercise must be received within the option period."] },

    { id: "b-c-87", topic: "Reliance option (§ 87(2))",
      components: ["An offer the offeror should reasonably expect to induce substantial action", "…before acceptance, and which does induce it", "Is binding as an option contract", "To the extent necessary to prevent injustice"],
      model: ["Rest. § 87(2): an offer which the offeror should reasonably expect to induce action or forbearance of a substantial character on the part of the offeree before acceptance, and which does induce such action or forbearance, is binding as an option contract to the extent necessary to prevent injustice.", "This is the modern counterweight to Dickinson's hard rule — the classic application is a subcontractor's bid relied on by a general contractor in its master bid."] },

    { id: "b-c-consid", topic: "Consideration — definition and forms",
      components: ["Bargained-for exchange — sought by the promisor, given in exchange", "Form — a return promise", "Form — performance: an act other than a promise", "Form — performance: forbearance", "Form — performance: affecting legal relations"],
      model: ["Consideration is a bargained-for exchange: something sought by the promisor in exchange for the promise and given by the promisee in exchange for that promise.", "Four forms: a return promise; performance by an act other than a promise; performance by forbearance; and performance affecting legal relations."] },

    { id: "b-c-benefit", topic: "Benefit and detriment",
      components: ["Benefit to the promisor is NOT required", "Giving up a legal right you were free to exercise is consideration (Hamer)", "Conversely, almost any benefit to the promisor suffices (Langer)", "e.g. the advantage of a promisee not working for a competitor"],
      model: ["Consideration does not require benefit to the promisor: abstaining from exercising a legal right you were free to exercise — drinking, cards, tobacco until twenty-one — is consideration (Hamer v. Sidway).", "Working the other direction, almost any benefit to the promisor will support a promise: 'it is reasonable to conclude that it is to the advantage of the promisor if the promisee is not employed by a competitive company' (Langer v. Superior Steel)."] },

    { id: "b-c-past", topic: "Past consideration (Dougherty v. Salt)",
      components: ["Consideration already received cannot support a future promise", "The aunt's note recited value but nothing was exchanged for it", "A gratuitous promise dressed as a contract is still gratuitous"],
      model: ["Consideration that has already been received does not support a future promise (Dougherty v. Salt) — the aunt's promissory note to her nephew recited consideration, but nothing was sought or given in exchange for it.", "This is the same timing defect that later sinks Mills and Harrington."] },

    { id: "b-c-kirksey", topic: "Gift condition vs. exchange (Kirksey)",
      components: ["A condition merely necessary to receive a gift is not consideration", "Test: was the act sought in exchange, or is it how the gift is collected?", "Exchange — going to the store benefits the promisor", "Gratuitous condition — going to the store merely effects the gift"],
      model: ["If the 'consideration' is just a necessary requirement of receiving the gift, it may not be valid consideration (Kirksey v. Kirksey) — the widow's move was the condition of a gratuity, not a bargained-for exchange.", "The test: going to the store to get out of the photograph is an exchange, because it benefits the promisor; going to the store because that is where the gift is handed over is a gratuitous condition."] },

    { id: "b-c-forbear", topic: "Forbearance of claims (§ 74)",
      components: ["Forbearance from asserting a claim is valid consideration", "Forbearing an INVALID claim is not, unless…", "(a) the claim is in fact doubtful as to facts or law, or", "(b) the forbearing party believes it may fairly be determined valid", "Good faith separates settlement from extortion"],
      model: ["Forbearance from asserting a claim is valid consideration (Military College Co. v. Brooks).", "Rest. 2d § 74(1) limits it: forbearance to assert a claim or defense which proves to be invalid is not consideration unless (a) the claim or defense is in fact doubtful because of uncertainty as to the facts or the law, or (b) the forbearing party believes that the claim or defense may be fairly determined to be valid."] },

    { id: "b-c-pe", topic: "Promissory estoppel — elements",
      components: ["A promise — sufficiently definite, but not a whole contract", "Promisor should reasonably expect it to induce action or forbearance", "It ACTUALLY induces that action or forbearance", "Injustice can be avoided only by enforcement"],
      model: ["Rest. § 90: a promise which the promisor should reasonably expect to induce action or forbearance on the part of the promisee or a third person, and which does induce such action or forbearance, is binding if injustice can be avoided only by enforcement of the promise.",
        "Four elements: (1) a promise — not an entire contract, but sufficiently definite; (2) the promisor should reasonably expect it to induce action or forbearance, judged by his objective reasonableness; (3) it actually induces that action or forbearance; (4) injustice can be avoided only by enforcement."] },

    { id: "b-c-pe2", topic: "Promissory estoppel — scope and limits",
      components: ["Reliance substitutes for consideration", "The remedy may be limited as justice requires", "The promise need not equal a contractual offer (Stewart)", "The promise must PRECEDE the reliance", "Gratitude for a completed act induces nothing (Harrington)"],
      model: ["Promissory estoppel makes reliance a substitute for consideration, and the remedy granted for breach may be limited as justice requires.", "A § 90 promise need not be the functional equivalent of an offer to enter a contract — which is why a jury can find no contract but still find estoppel (Stewart v. Cendant).", "The hard limit is timing: the promise must come before the reliance. A promise made in gratitude for an act already completed induces nothing (Harrington v. Taylor)."] },

    { id: "b-c-ue", topic: "Unjust enrichment — elements",
      components: ["One unjustly enriched at another's expense is liable in restitution", "Element 1 — receipt of a benefit from the plaintiff", "Element 2 — retention of the benefit is unjust", "The plaintiff must show BOTH"],
      model: ["A person who is unjustly enriched at the expense of another is subject to liability in restitution. The plaintiff must show both elements: receipt of a benefit from the plaintiff, and that retention of that benefit would be unjust."] },

    { id: "b-c-ue-benefits", topic: "Unjust enrichment — what is a benefit",
      components: ["Grant of a possessory interest — money, land, possessions", "Performing services beneficial to or at the request of the defendant", "Satisfaction of the defendant's debt", "Any other benefit that 'in any way adds to the other's advantage'"],
      model: ["Benefits satisfying element one include: a grant of possessory interest, giving the defendant an interest in money, land, or possessions; performing services that are either beneficial to, or at the request of, the defendant; satisfaction of the defendant's debt; and other benefits — anything that 'in any way adds to the other's advantage.'"] },

    { id: "b-c-ue-x", topic: "Unjust enrichment — exceptions",
      components: ["Unrequested benefit voluntarily conferred (the volunteer)", "Choosing gratuity over contracting creates no obligation", "Forced exchange", "Unrequested services the party wouldn't have bought at market value", "Both defeat element two, not element one"],
      model: ["Two exceptions defeat the second element even though a benefit was plainly received. First, an unrequested benefit voluntarily conferred: gratuitously choosing to confer a benefit instead of entering into a contract does not create a compensation obligation. Second, a forced exchange: receiving unrequested services the party would not necessarily have purchased at market value does not create one either."] },

    { id: "b-c-subordinate", topic: "Restitution is subordinate to contracts",
      components: ["Where a valid contract governs the benefit, it fixes the recovery", "Restitution cannot be used to rewrite the bargain", "Restatement (Third): the target is enrichment lacking an adequate legal basis", "A contract IS an adequate legal basis"],
      model: ["Restitution is subordinate to contracts: where a valid contract governs the exact benefit conferred, it fixes the recovery and unjust enrichment is unavailable.", "Restatement (Third) framing: the concern is not unjust enrichment in a broad sense but unjustified enrichment — enrichment that lacks an adequate legal basis. A valid contract is such a basis."] },

    { id: "b-c-sparks", topic: "Sparks v. Gustafson",
      components: ["Gustafson managed the building for years without charge or request for payment", "Continued after Sparks died, with the executor's knowledge, paying expenses himself", "Relationship and delay suggested gratuity — but did not control", "Extent and business character of the services overcame that inference", "Distinguished Kershaw's ordinary favors between friends"],
      model: ["Gustafson managed the Nome Center Building for a friend without charge, continued after the owner's death with the executor's knowledge, collected rents, made repairs, and paid expenses out of pocket, never requesting payment until a sale fell through.", "The closeness of the relationship and his failure to request payment suggested gratuitous intent, but the extent and professional character of the services overcame it — services of the sort an ordinary person would expect to pay for. It was inequitable for the Estate to receive them while retaining the benefits, distinguishing Kershaw's ordinary favors."] },

    { id: "b-c-moral2", topic: "Promises for benefits received — two types",
      components: ["Gratitude for past actions / moral consideration", "…not always enforceable", "Subsequent affirmation of an unenforceable promise", "…typically enforceable"],
      model: ["Two categories. Gratitude for past actions, or moral consideration — not always enforceable. And subsequent affirmation of an unenforceable promise — typically enforceable."] },

    { id: "b-c-mills", topic: "Mills v. Wyman",
      components: ["Mills, a stranger, nursed Levi Wyman (age 25, independent) who then died", "The father afterward promised by letter to pay the expenses", "Promise made AFTER the care was complete — no consideration", "Moral obligation alone will not support a promise", "No pre-existing legal obligation to revive"],
      model: ["Mills, a stranger, cared for Levi Wyman — an adult, independent son — who then died. The father afterward wrote promising to pay the expenses, then refused.",
        "Certain promises for benefits received may be unenforceable notwithstanding any moral obligation: the care was already complete when the promise was made, so nothing was bargained for, and the father had no pre-existing legal obligation to revive. Nonsuit affirmed."] },

    { id: "b-c-revival", topic: "Pre-existing legal obligation categories",
      components: ["Debts incurred during infancy", "Debts barred by the statute of limitations", "Debts discharged in bankruptcy", "Common thread — a real legal obligation existed and became unenforceable", "The later promise REVIVES it"],
      model: ["Moral obligation can support a promise where it revives a pre-existing legal obligation that became unenforceable for a technical reason: debts incurred during infancy, debts barred by the statute of limitations, and debts discharged in bankruptcy.",
        "In each, a genuine legal obligation once existed and merely lost enforceability — the new promise revives it rather than creating something from nothing. Wyman had no such obligation, which is why gratitude alone could not bind him."] },

    { id: "b-c-webb", topic: "Webb v. McGowin",
      components: ["Webb diverted a falling block to save McGowin, crippling himself", "McGowin promised to pay him regularly for life, and paid until his death", "Moral consideration for a MATERIAL BENEFIT supported the promise", "The promisor himself received the direct benefit", "Minority position — Alabama"],
      model: ["Webb, dropping a heavy block from an upper floor of a mill, diverted it to avoid killing McGowin below and was permanently disabled in the process. McGowin promised to pay him a sum regularly for life and paid until he died, whereupon the estate stopped.",
        "The court held the moral consideration for a material benefit supported an enforceable contract. The key anchor: the promisor himself received the direct, material benefit — his own life. This is a minority position."] },

    { id: "b-c-harrington", topic: "Harrington v. Taylor",
      components: ["Taylor assaulted his wife; she knocked him down and raised an axe", "Harrington caught the blow with her hand, saving him and mutilating it", "Taylor promised to pay her damages, paid a small sum, then stopped", "Held: a humanitarian act voluntarily performed is not consideration", "However much gratitude compels it, the promise is unenforceable"],
      model: ["Taylor assaulted his wife, who took refuge with Harrington; the next day he assaulted her again, she knocked him down with an axe and was about to strike, and Harrington intercepted the blow with her hand, saving his life and mutilating her hand. He promised to pay her damages, paid a small sum, then nothing more.",
        "Held: a voluntary humanitarian act is not such consideration as would entitle her to recover at law, however much the defendant should be impelled by common gratitude. Demurrer sustained, affirmed."] },

    { id: "b-c-86", topic: "Restatement § 86",
      components: ["A promise in recognition of a benefit previously received by the promisor", "…from the promisee", "Is binding to the extent necessary to prevent injustice", "Not binding if conferred as a gift or the promisor was not unjustly enriched", "Not binding to the extent its value is disproportionate to the benefit"],
      model: ["Rest. § 86: a promise made in recognition of a benefit previously received by the promisor from the promisee is binding to the extent necessary to prevent injustice.",
        "Such a promise is not binding if the promisee conferred the benefit as a gift or for other reasons the promisor has not been unjustly enriched, or to the extent that its value is disproportionate to the benefit.",
        "Note the anchor: the benefit must have run to the promisor, from the promisee — third-party gratitude falls outside."] },

    { id: "b-c-split", topic: "The moral consideration split",
      components: ["Yes — a material benefit received can support an enforceable promise", "Yes, but — enforceable only to the extent of the benefit", "No — bargained-for exchange required at the moment of contract", "Exams and the bar: argue BOTH the Webb and Harrington interpretations", "In practice: advise the client and prepare backup arguments"],
      model: ["Jurisdictions split three ways on whether moral consideration is enough: yes, a material benefit received can support an enforceable promise; yes, but the promise is only enforceable to the extent of the benefit; or no, a bargained-for exchange is required at the moment of contract.",
        "The professor's playbook: on this class's exams and on the bar, write 'if the court uses a Harrington interpretation…' and 'if the court uses a Webb interpretation…'. In practice, advise the partner and client and prepare backup arguments against the competing case law."] },
  ],

  torts: [
    { id: "b-t-intent", topic: "Intent",
      components: ["Purpose to cause the contact or apprehension, OR", "Knowledge to a substantial certainty that it will result", "Intent to HARM is not required", "Substantial certainty is higher than risk or recklessness"],
      model: ["Intent is satisfied where the actor acts with the purpose of causing the contact or apprehension, or with knowledge to a substantial certainty that it will result.", "Intent to injure is not required — only intent as to the contact itself. Note the height of the standard: substantial certainty, not mere risk or recklessness."] },

    { id: "b-t-capacity", topic: "Capacity to form intent",
      components: ["A minor may be liable if capable of forming the requisite intent", "Age bears only on experience, capacity, and understanding (Garratt)", "Mental disability does not bar intent (Wagner)", "The tort needs intent to contact, not appreciation of wrongfulness", "Capacity is a factual question, not a categorical defense"],
      model: ["Neither minority nor mental disability is a categorical bar. A minor may be liable for an intentional tort if capable of forming the requisite intent; age matters only insofar as it bears on whether this child, given his experience, capacity, and understanding, knew the contact was substantially certain to follow (Garratt v. Dailey).",
        "A mentally disabled actor can likewise form intent to contact — the tort does not require appreciation that the act is wrong (Wagner v. State)."] },

    { id: "b-t-transfer", topic: "Transferred intent",
      components: ["Intent against A transfers when B is injured instead", "Intent also transfers between torts", "Covers battery, assault, false imprisonment, trespass to land, trespass to chattels", "No intent toward the specific victim required"],
      model: ["Where the defendant intends one of the covered intentional torts against one person, that intent transfers to the person actually injured and to the tort actually committed — no intent toward the specific victim is required (Talmage v. Smith: a stick thrown at one trespassing boy that blinds another supports battery).",
        "The doctrine covers the five historic trespass writs: battery, assault, false imprisonment, trespass to land, and trespass to chattels."] },

    { id: "b-t-taylor", topic: "Taylor v. Vallelunga — the transferred intent limit",
      components: ["Daughter watched her father being beaten; she was not touched", "No allegation the defendants knew she was present", "…or intended to cause HER distress", "Transferred intent does not supply bystander IIED", "Demurrer sustained; dismissal affirmed"],
      model: ["The plaintiff witnessed a beating of her father and sued for emotional distress. She could not recover: there was no allegation the defendants knew she was present or intended to cause her distress.",
        "Intent directed at the primary victim does not transfer to a bystander's IIED claim — the bystander must be within the defendant's contemplation."] },

    { id: "b-t-battery", topic: "Battery — elements",
      components: ["An intentional act", "Causing harmful or offensive contact", "With the person of another", "Without consent"],
      model: ["Battery: an intentional act causing harmful or offensive contact with the person of another, without consent. Intent runs to the contact, not to the harm — no physical injury is required, and a plaintiff proving battery without harm may recover nominal damages."] },

    { id: "b-t-battery2", topic: "Battery — offensive contact",
      components: ["Offensiveness judged by an ordinary person, in context", "Crowded-life contact is not offensive unless rude, insolent, or angry (Wallace)", "Contact with anything closely identified with the body counts (Fisher)", "Battery protects personal dignity, not just the body"],
      model: ["Offensiveness is judged objectively by ordinary sensibilities and in context — ordinary contact in the customary give-and-take of crowded life is not offensive unless rude, insolent, or angry (Wallace v. Rosen, a teacher tapping a parent's back during a fire drill).",
        "The contact need not touch the body: anything so closely identified with the person as to be customarily regarded as part of it — a plate snatched from the hand — suffices, because battery protects personal dignity (Fisher v. Carrousel Motor Hotel)."] },

    { id: "b-t-assault", topic: "Assault — elements",
      components: ["An intentional act", "Causing reasonable apprehension", "Of an IMMINENT harmful or offensive contact", "Apprehension is awareness, not fear"],
      model: ["Assault: an intentional act causing the plaintiff reasonable apprehension of an imminent harmful or offensive contact. Apprehension means awareness of the threatened contact — it is not fear, so an unafraid plaintiff still has a claim."] },

    { id: "b-t-assault2", topic: "Assault — apparent ability",
      components: ["Apparent ability to complete the contact suffices", "Actual ability is not required", "Judged from a reasonable person's viewpoint", "Western Union v. Hill — the counter may have blocked the reach"],
      model: ["The defendant needs only apparent ability to carry out the threatened contact, judged from the standpoint of a reasonable person in the plaintiff's position; actual ability is not required (Western Union Telegraph Co. v. Hill, where the counter may have made the reach physically impossible)."] },

    { id: "b-t-fi", topic: "False imprisonment — elements",
      components: ["An intentional act", "Restraint of physical liberty within boundaries fixed by the defendant", "Without adequate legal justification", "Restraint may be non-physical — threats, duress, asserted authority"],
      model: ["False imprisonment: an intentional direct restraint of another's physical liberty within boundaries fixed by the defendant, without adequate legal justification.",
        "The restraint need not be physical — threats, duress, or asserted legal authority suffice, as where a nursing home seized belongings, denied phone use, and retrieved a resident who left (Big Town Nursing Home v. Newman), where egregious disregard of rights also supported punitive damages."] },

    { id: "b-t-parvi", topic: "False imprisonment — awareness (Parvi)",
      components: ["The plaintiff must be conscious of the confinement at the time", "…or else harmed by it", "Later memory of the confinement is NOT required", "Intoxicated plaintiff's lack of memory is a jury question, not a bar"],
      model: ["False imprisonment requires that the plaintiff be conscious of the confinement at the time, or else harmed by it. But awareness at the time and memory afterward are different things: a plaintiff who cannot later recall being confined may still recover, so an intoxicated plaintiff's lack of memory presents a jury question rather than a bar (Parvi v. City of Kingston)."] },

    { id: "b-t-iied", topic: "IIED — elements",
      components: ["Intentional or reckless conduct", "Extreme and outrageous conduct", "Causal connection between the conduct and the distress", "The distress must be SEVERE"],
      model: ["IIED has four elements: the conduct was intentional or reckless; it was extreme and outrageous; there is a causal connection between the conduct and the emotional distress; and the distress was severe."] },

    { id: "b-t-harris", topic: "IIED — severity (Harris v. Jones)",
      components: ["Severity is the usual point of failure", "The law expects people to tolerate some rough treatment", "Vague or weak evidence of aggravation is insufficient", "Outrageous conduct proven, severity not — plaintiff lost"],
      model: ["Severity is the demanding element. A supervisor mimicked the plaintiff's stutter dozens of times over months — plainly outrageous — but the evidence that his distress was severe was too vague and weakly supported, so the claim failed (Harris v. Jones).",
        "The law expects people to tolerate a certain amount of rough treatment; proving outrageousness is not enough."] },
  ],

  civpro: [
    { id: "b-cp-smj", topic: "State vs. federal SMJ",
      components: ["State courts — general SMJ, the catch-all", "Federal courts — limited SMJ", "Federal: all federal claims + state claims meeting diversity", "SMJ is never waivable — sua sponte dismissal"],
      model: ["State courts have general subject matter jurisdiction — they can hear any claim outside exclusive federal SMJ and are always available as a catch-all. Federal courts have limited SMJ: all federal law claims, but state law claims only where diversity requirements are met.",
        "Federal SMJ can never be waived, stipulated, or consented into existence; a judge noticing its absence must dismiss sua sponte."] },

    { id: "b-cp-caps", topic: "Exclusive, concurrent, and default SMJ",
      components: ["Exclusive federal — CAPS: copyright, antitrust, patent infringement, securities", "Concurrent — most federal claims, either system", "Default — state court remains when federal requirements fail", "Diversity is irrelevant to a CAPS claim"],
      model: ["Exclusive federal jurisdiction is narrow — CAPS: copyright, antitrust, patent infringement, and securities. Diversity analysis never starts for these; same-state parties are irrelevant.",
        "Most federal claims — Title VII, for instance — are concurrent, so either system may hear them. Where neither a federal claim nor diversity exists, state court is the default forum ('default SMJ')."] },

    { id: "b-cp-complete", topic: "Complete diversity",
      components: ["§ 1332(a) — citizens of different states, exceeding $75,000", "No plaintiff may share a state with any defendant", "Shared citizenship on the SAME side is fine", "One overlapping pair destroys the whole case"],
      model: ["28 U.S.C. § 1332(a): original jurisdiction where the matter in controversy exceeds $75,000, exclusive of interest and costs, and is between citizens of different states.",
        "Complete diversity means no plaintiff may be a citizen of the same state as any defendant. Same-side overlap is irrelevant — all plaintiffs may be Floridians and all defendants Georgians — but a single overlapping pair across the v. destroys jurisdiction over the entire case."] },

    { id: "b-cp-domicile", topic: "Citizenship — natural persons",
      components: ["A citizen of the state of domicile", "Domicile = true, fixed, and permanent home", "Always exactly one; never more than one", "A child takes the parents' domicile until majority or emancipation"],
      model: ["A natural person is a citizen of the state in which she is domiciled — her true, fixed, and permanent home. Everyone always has one domicile and never more than one. A child takes the domicile of the parents unless changed at the age of majority or upon emancipation."] },

    { id: "b-cp-stateless", topic: "Stateless citizens (Friedrich)",
      components: ["A U.S. citizen domiciled abroad is not a citizen of any state", "…and is not an alien either", "'Stateless' — fits no § 1332 category", "Neither diversity nor alienage jurisdiction is available"],
      model: ["A U.S. citizen domiciled abroad is not a citizen of a state, because domicile is abroad, and is not an alien, because she remains a U.S. citizen — 'stateless' (Friedrich v. Davis).",
        "Such a party fits no § 1332 category, so her presence on either side defeats both diversity and alienage jurisdiction. Chain this with the member rule: one stateless partner makes a partnership un-diverse against anyone."] },

    { id: "b-cp-corp", topic: "Citizenship — corporations",
      components: ["Every state by which it has been incorporated", "Plus the ONE state of its principal place of business", "PPB by the nerve center test (Harrison)", "Where officers direct, control, and coordinate — not where operations occur", "BOTH citizenships count for complete diversity"],
      model: ["A corporation is a citizen of every state by which it has been incorporated and of the one state where it has its principal place of business.",
        "The PPB is located by the nerve center test — the place where officers direct, control, and coordinate the corporation's activities, not where the operations physically happen (Harrison v. Granite Bay Care). Both citizenships count, so a Delaware corporation with a New York nerve center is non-diverse against any New Yorker."] },

    { id: "b-cp-members", topic: "Citizenship — partnerships, LLCs, unions",
      components: ["Citizen of every state where ANY partner or member is a citizen", "No principal place of business rule applies", "One member in the wrong state destroys diversity", "The classic trap is treating an LLC like a corporation"],
      model: ["A partnership, LLC, or labor union is a citizen of every state in which any partner or member is a citizen. There is no PPB rule for these — membership is everything, so an LLC with members in ten states is a citizen of all ten and one member in the wrong state destroys complete diversity."] },

    { id: "b-cp-legalrep", topic: "Citizenship — legal representatives",
      components: ["Deemed a citizen only of the represented person's state", "§ 1332(c)(2)", "Covers decedents, infants, and incompetents", "The representative's own domicile is ignored"],
      model: ["Under § 1332(c)(2), the legal representative of the estate of a decedent is deemed a citizen only of the same state as the decedent, and the representative of an infant or incompetent only of the same state as that person.",
        "The representative's own domicile is irrelevant: a Georgia executor for a Florida decedent is a Florida citizen for diversity purposes — which also blocks manufacturing diversity by picking an out-of-state representative."] },

    { id: "b-cp-timing", topic: "Timing of citizenship",
      components: ["Determined when the lawsuit is commenced", "Pre-commencement changes count, regardless of reason", "Post-commencement changes never create or destroy diversity", "The AIC is likewise fixed at commencement"],
      model: ["A party's citizenship is determined when the lawsuit is commenced. Pre-commencement changes count regardless of the reason — they may create or destroy diversity, and motive alone is not disqualifying. Post-commencement changes never do, so a defendant cannot escape a federal forum by relocating mid-case.", "The amount in controversy is likewise fixed at commencement."] },

    { id: "b-cp-change", topic: "Changing domicile",
      components: ["Physical presence in the new state — crossing the line counts", "AND intent to make it the true, fixed, permanent home", "Both prongs must coincide", "Courts test intent with objective evidence (Ceglia)", "Residence, property, accounts, voter registration, employment, license, taxes"],
      model: ["A natural person changes domicile by physical presence in the new state — crossing the state line counts — plus intent to make it her true, fixed, and permanent home. Both must coincide.",
        "Courts test intent with objective evidence: physical residence, personal and real property, bank and brokerage accounts, voter registration, employment, driver's license and auto registration, and payment of taxes (Ceglia v. Zuckerberg). Saying you have moved is not enough; the paper trail decides."] },

    { id: "b-cp-alienage", topic: "Alienage — the basic rule",
      components: ["§ 1332(a)(2) — citizens of a state vs. citizens or subjects of a foreign state", "The alien may be on either side", "Diversity exists between an alien and a U.S. citizen domiciled in a state", "Extra alien parties don't destroy it if a diverse pairing anchors the suit"],
      model: ["Under § 1332(a)(2), jurisdiction exists between citizens of a state and citizens or subjects of a foreign state; the alien may appear on either side of the v.",
        "Additional alien parties do not destroy jurisdiction so long as a properly diverse plaintiff–defendant pairing anchors the suit."] },

    { id: "b-cp-alienage2", topic: "Alienage — the limits",
      components: ["LPRA vs. U.S. citizen works — UNLESS domiciled in the same state", "That carve-out is statutory text in § 1332(a)(2)", "Alien vs. alien — never", "…even two LPRAs domiciled in different states", "π(MEX) v. Δ(MEX) + Δ(FLA) fails until the alien defendant is dropped"],
      model: ["Statutory carve-out: no jurisdiction where a foreign citizen lawfully admitted for permanent residence is domiciled in the same U.S. state as the opposing citizen — that is written into § 1332(a)(2), not judge-made.",
        "Alienage never exists between two aliens, even where both are LPRAs domiciled in different states. So π (MEX) against Δ (MEX) and Δ (FLA) fails; drop the Mexican defendant and it works."] },

    { id: "b-cp-aic", topic: "Amount in controversy — the threshold",
      components: ["Must EXCEED $75,000 — exactly $75,000 fails", "Exclusive of interest and costs", "The plaintiff's good-faith allegation controls", "Legal certainty test — it exists unless certain it does not", "Recovery below the threshold does not defeat jurisdiction"],
      model: ["The matter in controversy must exceed $75,000, exclusive of interest and costs — exactly $75,000 fails.",
        "The plaintiff's good-faith allegation controls: if the plaintiff says the amount exists, it exists unless we can say to a legal certainty that it does not. Because the AIC is measured at commencement, a later recovery below the threshold does not retroactively defeat jurisdiction."] },

    { id: "b-cp-aic2", topic: "Amount in controversy — what counts",
      components: ["Pre-filing interest counts; post-filing interest does not", "Costs never count — filing fees, court reporters, experts", "Attorney fees count only under an exception to the American Rule", "Injunctions — either side's valuation may satisfy (exam rule)", "Mitigation reduces the claim (Bush v. Roadway)"],
      model: ["Interest: pre-filing interest counts toward the AIC; post-filing interest does not. Costs — filing fees, court reporter fees, expert witness fees — never count. Attorney fees count only where recoverable under some exception to the American Rule.",
        "For injunctions, the exam rule is that the AIC is satisfied if either party's valuation exceeds the threshold. And mitigation reduces the claim: interim wages from a new job are subtracted from a lost-wages figure (Bush v. Roadway Express)."] },

    { id: "b-cp-agg", topic: "Aggregation rules",
      components: ["One plaintiff + one defendant — may aggregate all claims, related or not", "One plaintiff + multiple defendants — may NOT aggregate", "Multiple plaintiffs + one defendant — may NOT aggregate", "Joint claims count once, at full value against each defendant"],
      model: ["A single plaintiff may aggregate the value of all her claims against a single defendant, related or not. A single plaintiff may not aggregate claims against two different defendants, and two plaintiffs may not aggregate their separate claims against a single defendant.",
        "A joint claim — joint tortfeasors, or jointly held property or rights — counts once at full value rather than presenting an aggregation problem, so under joint and several liability the full amount is in controversy against each defendant."] },

    { id: "b-cp-collusive", topic: "Collusive joinder & realignment",
      components: ["Artificial assignments made solely to manufacture diversity are disregarded", "Does NOT reach a genuine unilateral citizenship change", "Motive alone is not disqualifying", "Realignment by actual interests, not complaint labels", "Realignment can create or destroy diversity"],
      model: ["Courts disregard artificial assignments of claims made solely to manufacture diversity. But the doctrine does not reach a genuine, unilateral change of citizenship made to create diversity — motive alone is not disqualifying, so actually moving your life counts while assigning a claim to a strawman does not.",
        "Separately, the court may realign parties according to their actual interests rather than how the complaint labels them, which can create or destroy diversity."] },

    { id: "b-cp-drp", topic: "Domestic relations & probate exceptions",
      components: ["Domestic relations — divorce, alimony, and custody DECREES only", "Does NOT bar collection of unpaid spousal or child support [exam]", "Probate — no direct administration of an estate or will", "Related tort/misconduct claims against administrators CAN be heard"],
      model: ["The domestic relations exception is narrowly limited to divorce, alimony, and child custody decrees. It does not apply to a collection action to recover unpaid spousal or child support — the professor flagged this for the exam.",
        "The probate exception means federal courts will not administer an estate or will directly, but they can hear related tort or misconduct claims against those who administer estates."] },
  ],
};

/* ============================================================
   ELEMENT LADDERS — count first, then fill every slot.
   { id, concept, prompt, slots: [{ label, keywords: [...] }] }
   Grading is unordered: a typed line matches any unmatched slot
   whose keywords appear in it.
   ============================================================ */

const LADDERS = {
  contracts: [
    {
      id: "l-c-pe", concept: "Promissory estoppel", prompt: "Name the elements of promissory estoppel (Rest. § 90).",
      slots: [
        { label: "A promise (sufficiently definite)", keywords: ["promise"] },
        { label: "Promisor should reasonably expect it to induce action or forbearance", keywords: ["reasonably expect", "should expect", "expect to induce"] },
        { label: "It actually induces that action or forbearance", keywords: ["actually", "does induce", "in fact induce"] },
        { label: "Injustice can be avoided only by enforcement", keywords: ["injustice"] },
      ],
    },
    {
      id: "l-c-consid", concept: "Consideration", prompt: "Name the forms consideration can take.",
      slots: [
        { label: "Return promise", keywords: ["return promise", "promise for a promise", "counter promise"] },
        { label: "Performance: an act other than a promise", keywords: ["act other than", "an act", "performance act"] },
        { label: "Performance: forbearance", keywords: ["forbear"] },
        { label: "Performance: affecting legal relations", keywords: ["legal relation", "affecting legal"] },
      ],
    },
    {
      id: "l-c-ue", concept: "Unjust enrichment", prompt: "Name the elements of an unjust enrichment claim.",
      slots: [
        { label: "Receipt of a benefit from the plaintiff", keywords: ["receipt", "benefit conferred", "received a benefit", "benefit from"] },
        { label: "Retention of the benefit is unjust", keywords: ["retention", "retain", "unjust", "inequitable"] },
      ],
    },
    {
      id: "l-c-ue-x", concept: "Unjust enrichment exceptions", prompt: "Name the exceptions that make retention of a benefit NOT unjust.",
      slots: [
        { label: "Unrequested benefit voluntarily conferred (volunteer)", keywords: ["voluntar", "unrequested", "volunteer", "gratuitous"] },
        { label: "Forced exchange", keywords: ["forced"] },
      ],
    },
    {
      id: "l-c-offer", concept: "Offer factors", prompt: "Name the factors indicating an offer (8 — mnemonic: Fuckin Critics Can't Always Judge My Poor Attitude).",
      slots: [
        { label: "Finality", keywords: ["final"] },
        { label: "Completeness", keywords: ["complete"] },
        { label: "Context", keywords: ["context"] },
        { label: "Audience", keywords: ["audience"] },
        { label: "Jargon", keywords: ["jargon", "magic word"] },
        { label: "Method of acceptance", keywords: ["method"] },
        { label: "Public policy / fairness", keywords: ["policy", "fair"] },
        { label: "Accepted practice / course of dealing", keywords: ["accepted practice", "course of dealing", "practice", "history"] },
      ],
    },
    {
      id: "l-c-accept", concept: "Acceptance factors", prompt: "Name the acceptance factors (6 — mnemonic: For My Pretty Panda Ms. Nori).",
      slots: [
        { label: "Finality of acceptance", keywords: ["final"] },
        { label: "Method of acceptance", keywords: ["method"] },
        { label: "Acceptance by promise", keywords: ["promise"] },
        { label: "Acceptance by performance", keywords: ["performance", "perform"] },
        { label: "Mirror image rule", keywords: ["mirror"] },
        { label: "Notice of acceptance", keywords: ["notice"] },
      ],
    },
    {
      id: "l-c-term", concept: "Termination of the offer", prompt: "Name the ways an offer terminates.",
      slots: [
        { label: "Rejection", keywords: ["reject"] },
        { label: "Revocation", keywords: ["revo"] },
        { label: "Counteroffer", keywords: ["counter"] },
        { label: "Lapse of time", keywords: ["lapse", "time", "expire"] },
        { label: "Death of the offeror", keywords: ["death", "dies", "died"] },
      ],
    },
    {
      id: "l-c-mills", concept: "Pre-existing legal obligation categories", prompt: "Name the categories where moral obligation CAN support a promise (Mills).",
      slots: [
        { label: "Debts incurred during infancy", keywords: ["infan", "minor", "minority"] },
        { label: "Debts barred by the statute of limitations", keywords: ["limitation", "time barred", "statute of lim"] },
        { label: "Debts discharged in bankruptcy", keywords: ["bankrupt", "discharge"] },
      ],
    },
    {
      id: "l-c-ads", concept: "Advertisement-as-offer test", prompt: "Name the questions for whether an advertisement is an offer.",
      slots: [
        { label: "Was performance promised in positive terms in return for something requested?", keywords: ["performance", "positive terms", "promised"] },
        { label: "Is it clear, definite, explicit — nothing open for negotiation?", keywords: ["definite", "clear", "explicit", "negotiation"] },
        { label: "Do other facts show the advertiser intended an offer?", keywords: ["other facts", "circumstance", "intent", "intended"] },
      ],
    },
  ],

  torts: [
    {
      id: "l-t-intent", concept: "Intent", prompt: "Name the two ways the intent element is satisfied.",
      slots: [
        { label: "Purpose to cause the contact or apprehension", keywords: ["purpose", "desire", "intend to cause"] },
        { label: "Knowledge to a substantial certainty that it will result", keywords: ["substantial certainty", "substantially certain", "knowledge"] },
      ],
    },
    {
      id: "l-t-battery", concept: "Battery", prompt: "Name the elements of battery.",
      slots: [
        { label: "An intentional act", keywords: ["intent", "intentional act"] },
        { label: "Causing harmful or offensive contact", keywords: ["harmful", "offensive", "contact"] },
        { label: "With the person of another", keywords: ["person of another", "another", "plaintiff's person"] },
        { label: "Without consent", keywords: ["consent"] },
      ],
    },
    {
      id: "l-t-assault", concept: "Assault", prompt: "Name the elements of assault.",
      slots: [
        { label: "An intentional act", keywords: ["intent", "intentional act"] },
        { label: "Causing reasonable apprehension", keywords: ["apprehension", "reasonable apprehension"] },
        { label: "Of an imminent harmful or offensive contact", keywords: ["imminent", "harmful", "offensive"] },
      ],
    },
    {
      id: "l-t-fi", concept: "False imprisonment", prompt: "Name the elements of false imprisonment.",
      slots: [
        { label: "An intentional act", keywords: ["intent", "intentional"] },
        { label: "Restraint of the plaintiff's physical liberty within fixed boundaries", keywords: ["restrain", "confine", "boundar", "liberty"] },
        { label: "Without adequate legal justification", keywords: ["justification", "authority", "lawful", "legal justification"] },
        { label: "Plaintiff conscious of the confinement at the time (or harmed by it)", keywords: ["conscious", "aware", "awareness", "knowledge of"] },
      ],
    },
    {
      id: "l-t-iied", concept: "IIED", prompt: "Name the elements of intentional infliction of emotional distress.",
      slots: [
        { label: "Intentional or reckless conduct", keywords: ["intent", "reckless"] },
        { label: "Extreme and outrageous conduct", keywords: ["outrageous", "extreme"] },
        { label: "Causal connection between conduct and distress", keywords: ["caus"] },
        { label: "The emotional distress is SEVERE", keywords: ["severe"] },
      ],
    },
    {
      id: "l-t-transfer", concept: "Transferred intent torts", prompt: "Name the torts transferred intent applies to.",
      slots: [
        { label: "Battery", keywords: ["battery"] },
        { label: "Assault", keywords: ["assault"] },
        { label: "False imprisonment", keywords: ["false imprison", "imprison"] },
        { label: "Trespass to land", keywords: ["trespass to land", "land"] },
        { label: "Trespass to chattels", keywords: ["chattel"] },
      ],
    },
  ],

  civpro: [
    {
      id: "l-cp-div", concept: "Diversity jurisdiction", prompt: "Name the requirements for diversity jurisdiction under § 1332(a).",
      slots: [
        { label: "Complete diversity of citizenship", keywords: ["complete diversity", "diverse", "different states", "citizenship"] },
        { label: "Amount in controversy exceeding $75,000", keywords: ["75,000", "75000", "amount in controversy", "aic"] },
      ],
    },
    {
      id: "l-cp-caps", concept: "Exclusive federal SMJ", prompt: "Name the claims within exclusive federal subject matter jurisdiction (CAPS).",
      slots: [
        { label: "Copyright", keywords: ["copyright"] },
        { label: "Anti-trust", keywords: ["antitrust", "anti-trust", "anti trust"] },
        { label: "Patent infringement", keywords: ["patent"] },
        { label: "Securities", keywords: ["securit"] },
      ],
    },
    {
      id: "l-cp-entities", concept: "Citizenship by party type", prompt: "Name the party types whose citizenship is determined by a distinct rule.",
      slots: [
        { label: "Natural person — domicile", keywords: ["natural person", "individual", "domicil", "person"] },
        { label: "Corporation — incorporation + PPB", keywords: ["corporation", "incorporat"] },
        { label: "Partnership / LLC — every partner or member", keywords: ["partnership", "llc", "member", "partner"] },
        { label: "Legal representative — the represented person's state", keywords: ["representative", "executor", "estate", "decedent"] },
        { label: "Labor union — every member", keywords: ["union"] },
      ],
    },
    {
      id: "l-cp-agg", concept: "Aggregation rules", prompt: "Name the aggregation rules for the amount in controversy.",
      slots: [
        { label: "One plaintiff + one defendant: may aggregate all claims", keywords: ["one plaintiff one defendant", "single plaintiff", "may aggregate", "can aggregate"] },
        { label: "One plaintiff + multiple defendants: no aggregation", keywords: ["two defendants", "multiple defendants", "against two"] },
        { label: "Multiple plaintiffs + one defendant: no aggregation", keywords: ["two plaintiffs", "multiple plaintiffs"] },
        { label: "Joint claims count once at full value", keywords: ["joint"] },
      ],
    },
    {
      id: "l-cp-except", concept: "Exceptions to diversity", prompt: "Name the exceptions to diversity jurisdiction.",
      slots: [
        { label: "Collusive joinder", keywords: ["collusi"] },
        { label: "Domestic relations", keywords: ["domestic"] },
        { label: "Probate", keywords: ["probate"] },
      ],
    },
    {
      id: "l-cp-domicile", concept: "Changing domicile", prompt: "Name what a natural person must show to change domicile.",
      slots: [
        { label: "Physical presence in the new state", keywords: ["physical", "presence", "present"] },
        { label: "Intent to make it the true, fixed, permanent home", keywords: ["intent", "intend", "permanent"] },
      ],
    },
  ],
};

/* ============================================================
   ATTACK OUTLINES — the short checklist you memorize and blurt from.
   { title, sections: [{ h, items: [string | {h, items:[...]}] }] }
   ============================================================ */

const ATTACK = {
  contracts: {
    title: "Contracts — attack outline",
    sections: [
      {
        h: "0. Threshold",
        items: [
          "Goods or services? → UCC Article 2 vs. common law / Restatement (2d).",
          "Objective theory governs throughout: outward expression, not secret intent (Lucy v. Zehmer).",
        ],
      },
      {
        h: "1. Is there an offer?",
        items: [
          "§ 24: manifestation of willingness, so made as to justify understanding that assent is invited and will conclude it.",
          "§ 26 negative: no offer if a further manifestation of assent is required.",
          "Factors (none dispositive): finality · completeness · context · audience · jargon · method of acceptance · policy/fairness · accepted practice.",
          "Advertisement? → default invitation (Craft). Exception if performance promised in positive terms, clear/definite/explicit, other facts show intent (Lefkowitz; contrast Leonard).",
          "Price quotation? → course of dealing + manner of inviting acceptance (Nordyne; Fairmount; contrast Moulton).",
        ],
      },
      {
        h: "2. Was the offer still alive?",
        items: [
          "Terminated by: rejection · revocation · counteroffer · lapse of time · death of the offeror.",
          "§ 43: definite inconsistent action + reliable information kills the power of acceptance (Dickinson v. Dodds).",
          "Hold-open promise without consideration = nudum pactum, not binding.",
          "Option: supported by consideration → irrevocable; or § 87(2) substantial pre-acceptance reliance.",
        ],
      },
      {
        h: "3. Was there an acceptance?",
        items: [
          "§ 50: manifestation of assent in a manner invited or required by the offer.",
          "Mode: promise (every essential act + notice) vs. performance (part performed/tendered; preparation insufficient). Ambiguous → either.",
          "Mirror image: material change = counteroffer; § 61 mere request survives unless acceptance depends on it (Ardente).",
          "Notice: required for promise-acceptance (Hendricks); notice to an agent within authority binds the principal.",
          "Timing: § 63(a) acceptance effective on dispatch; revocations/rejections/second-move acceptances on receipt; options on receipt.",
        ],
      },
      {
        h: "4. Is there consideration?",
        items: [
          "Bargained-for exchange: return promise · act · forbearance · affecting legal relations.",
          "Benefit to promisor not required (Hamer); almost any benefit suffices (Langer).",
          "Not consideration: past consideration (Dougherty); a condition merely necessary to receive a gift (Kirksey).",
          "Forbearance of an invalid claim: § 74(1) — doubtful claim OR honest belief in validity.",
        ],
      },
      {
        h: "5. No consideration? Try the substitutes.",
        items: [
          "Promissory estoppel § 90 — promise · reasonably expected to induce · actually induces · injustice avoidable only by enforcement. Remedy as justice requires.",
          "Unjust enrichment — benefit received + retention unjust. Exceptions: volunteer; forced exchange. Subordinate to contracts.",
          "Promise for a benefit already received — Mills default; pre-existing legal obligation categories (infancy, SOL, bankruptcy); material benefit rule (Webb) vs. refusal (Harrington); § 86 with its gift / no-enrichment / disproportion limits.",
          "Argue BOTH interpretations where the jurisdiction is unsettled — that is the professor's stated expectation.",
        ],
      },
    ],
  },

  torts: {
    title: "Torts — attack outline",
    sections: [
      {
        h: "0. Intent gateway",
        items: [
          "Purpose to cause the contact/apprehension OR knowledge to a substantial certainty it will result.",
          "Intent to harm NOT required; understanding of wrongfulness NOT required.",
          "Capacity: minority (Garratt) and mental disability (Wagner) do not bar intent — they bear only on capacity to hold the knowledge.",
          "Transferred intent: battery · assault · false imprisonment · trespass to land · trespass to chattels (Talmage). Not bystander IIED (Taylor).",
        ],
      },
      {
        h: "1. Battery",
        items: [
          "Intentional act → harmful or offensive contact → with the person of another → without consent.",
          "Offensiveness judged by an ordinary person in context; crowded-life contact is not offensive (Wallace v. Rosen).",
          "Contact with anything closely identified with the body counts (Fisher) — protects dignity.",
          "No harm required → nominal damages.",
        ],
      },
      {
        h: "2. Assault",
        items: [
          "Intentional act → reasonable apprehension → of imminent harmful or offensive contact.",
          "Apprehension ≠ fear. Apparent ability suffices; actual ability not required (Western Union v. Hill).",
        ],
      },
      {
        h: "3. False imprisonment",
        items: [
          "Intentional act → restraint of physical liberty within fixed boundaries → without adequate legal justification.",
          "Restraint may be non-physical: threats, duress, asserted authority (Big Town).",
          "Plaintiff must be conscious of confinement at the time, or harmed by it; later memory not required (Parvi).",
        ],
      },
      {
        h: "4. IIED",
        items: [
          "Intentional or reckless → extreme and outrageous → causation → SEVERE distress.",
          "Severity is the usual failure point (Harris v. Jones).",
          "Bystander: defendant must know of the plaintiff's presence / direct the conduct at them (Taylor v. Vallelunga).",
        ],
      },
    ],
  },

  civpro: {
    title: "Civil Procedure — attack outline",
    sections: [
      {
        h: "1. Which court can hear this?",
        items: [
          "Exclusive federal (CAPS): copyright · antitrust · patent infringement · securities → federal only.",
          "Federal question but not CAPS → concurrent, either system.",
          "State law claim → federal only through diversity; otherwise default state SMJ.",
        ],
      },
      {
        h: "2. Complete diversity",
        items: [
          "No plaintiff may share a state with any defendant; same-side overlap is fine.",
          "Natural person → domicile (true, fixed, permanent; exactly one). U.S. citizen abroad → stateless (Friedrich).",
          "Corporation → every state of incorporation + PPB by nerve center (Harrison).",
          "Partnership / LLC / union → every partner or member's state.",
          "Legal representative → the represented person's state, § 1332(c)(2).",
          "Alienage § 1332(a)(2): alien v. citizen works; LPRA v. citizen of the SAME state fails; alien v. alien never.",
        ],
      },
      {
        h: "3. Amount in controversy",
        items: [
          "Must EXCEED $75,000; good-faith allegation controls unless legal certainty says otherwise.",
          "Pre-filing interest counts; post-filing interest and costs do not; attorney fees only under an American Rule exception.",
          "Injunction → either party's valuation (exam rule).",
          "Aggregation: 1π/1Δ may aggregate; 1π/multiple Δ may not; multiple π/1Δ may not; joint claims count once at full value.",
        ],
      },
      {
        h: "4. Timing and adjustments",
        items: [
          "Citizenship and AIC fixed at commencement. Pre-commencement changes count regardless of motive; post-commencement changes never do.",
          "Realignment by actual interests can create or destroy diversity.",
          "Collusive joinder: artificial assignments ignored; genuine unilateral moves allowed.",
          "Domestic relations: divorce/alimony/custody DECREES only — collection of unpaid support is fine [exam].",
          "Probate: no direct administration; related tort claims against administrators are fine.",
          "SMJ is never waivable — judge must dismiss sua sponte.",
        ],
      },
    ],
  },
};

/* ---------- helpers ---------- */

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function parseCloze(text) {
  const parts = [];
  const re = /\{\{(.+?)\}\}/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ t: "txt", v: text.slice(last, m.index) });
    parts.push({ t: "blank", v: m[1], i: i++ });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ t: "txt", v: text.slice(last) });
  return parts;
}

function pickCard(cards, prof, excludeId) {
  const pool = cards.filter((c) => c.id !== excludeId);
  const list = pool.length ? pool : cards;
  const weights = list.map((c) => {
    const p = prof[c.id];
    if (p === undefined) return 16; // new
    return (6 - p) * (6 - p); // 0→36 ... 5→1
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

const todayKey = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

const profLabel = (p) =>
  p === undefined ? "NEW" : p === 0 ? "STUDY PILE" : p <= 3 ? "LEARNING" : "MASTERED";

/* ---------- storage ---------- */

async function loadJSON(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function saveJSON(key, obj) {
  try {
    await window.storage.set(key, JSON.stringify(obj));
  } catch (e) {
    console.error("save failed", e);
  }
}

/* ---------- components ---------- */

function ClozeLine({ parts, values, setValues, graded, results, lineHeight }) {
  return (
    <div className="clozewrap" style={{ lineHeight }}>
      {parts.map((p, idx) =>
        p.t === "txt" ? (
          <span key={idx}>{p.v}</span>
        ) : (
          <span key={idx} className="blankspan">
            <input
              className={
                "blank " +
                (graded ? (results[p.i] ? "blank-right" : "blank-wrong") : "")
              }
              style={{ width: Math.max(70, p.v.length * 11) + "px" }}
              value={values[p.i] || ""}
              disabled={graded}
              onChange={(e) => {
                const nv = [...values];
                nv[p.i] = e.target.value;
                setValues(nv);
              }}
              placeholder="________"
              autoComplete="off"
            />
            {graded && !results[p.i] && (
              <span className="reveal"> {p.v} </span>
            )}
          </span>
        )
      )}
    </div>
  );
}

export default function BlackLetter() {
  const [stage, setStage] = useState("loading");
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [profile, setProfile] = useState({ proficiency: {} });
  const [mode, setMode] = useState("drill"); // drill | blurt | ladder | attack
  const [subject, setSubject] = useState("mixed");
  const saveTimer = useRef(null);

  /* drill state */
  const [card, setCard] = useState(null);
  const [tier, setTier] = useState("front");
  const [clozeVals, setClozeVals] = useState([]);
  const [clozeResults, setClozeResults] = useState([]);
  const [mcqPick, setMcqPick] = useState(null);
  const [stamp, setStamp] = useState(null);
  const [revealed, setRevealed] = useState(false);

  /* blurt state */
  const [blurt, setBlurt] = useState(null);
  const [blurtText, setBlurtText] = useState("");
  const [blurtPhase, setBlurtPhase] = useState("write"); // write | score | done
  const [hits, setHits] = useState([]);
  const [secs, setSecs] = useState(300);
  const [running, setRunning] = useState(false);

  /* ladder state */
  const [ladder, setLadder] = useState(null);
  const [countGuess, setCountGuess] = useState("");
  const [lPhase, setLPhase] = useState("count"); // count | fill | graded
  const [slotVals, setSlotVals] = useState([]);
  const [lResults, setLResults] = useState(null);

  /* ---- boot ---- */
  useEffect(() => {
    (async () => {
      const last = await loadJSON("bl:lastuser");
      if (last && last.email) {
        const p = (await loadJSON("bl:user:" + last.email)) || { proficiency: {} };
        setEmail(last.email);
        setProfile(p);
        setStage("app");
      } else setStage("login");
    })();
  }, []);

  /* ---- timer ---- */
  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { setRunning(false); setBlurtPhase("score"); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secs]);

  /* ---- pools ---- */
  const subjectKeys = Object.keys(DECK);
  const cardPool = useMemo(() => {
    if (subject === "mixed") return subjectKeys.flatMap((k) => DECK[k].cards.map((c) => ({ ...c, _s: k })));
    return DECK[subject].cards.map((c) => ({ ...c, _s: subject }));
  }, [subject]);
  const blurtPool = useMemo(() => {
    if (subject === "mixed") return subjectKeys.flatMap((k) => (BLURTS[k] || []).map((b) => ({ ...b, _s: k })));
    return (BLURTS[subject] || []).map((b) => ({ ...b, _s: subject }));
  }, [subject]);
  const ladderPool = useMemo(() => {
    if (subject === "mixed") return subjectKeys.flatMap((k) => (LADDERS[k] || []).map((l) => ({ ...l, _s: k })));
    return (LADDERS[subject] || []).map((l) => ({ ...l, _s: subject }));
  }, [subject]);

  /* ---- deal on mode/subject change ---- */
  useEffect(() => {
    if (stage !== "app") return;
    if (mode === "drill") dealCard(null);
    if (mode === "blurt") dealBlurt(null);
    if (mode === "ladder") dealLadder(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, mode, subject]);

  /* ---- persistence ---- */
  function persist(next) {
    setProfile(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveJSON("bl:user:" + email, next), 150);
  }
  function setProf(id, v) {
    persist({ ...profile, proficiency: { ...profile.proficiency, [id]: v } });
  }
  /* record() writes proficiency AND the attempt log in one pass, so the
     two never clobber each other by both calling persist(). */
  function record(id, v, ok) {
    const st = { ...(profile.stats || {}) };
    const cur = st[id] || { seen: 0, right: 0 };
    st[id] = { seen: cur.seen + 1, right: cur.right + (ok ? 1 : 0), last: Date.now() };
    const days = { ...(profile.days || {}) };
    const k = todayKey();
    days[k] = (days[k] || 0) + 1;
    persist({ ...profile, proficiency: { ...profile.proficiency, [id]: v }, stats: st, days });
  }
  function bump(id) {
    setProf(id, Math.min(5, (profile.proficiency[id] ?? 0) + 1));
  }
  function up(id) { return Math.min(5, (profile.proficiency[id] ?? 0) + 1); }

  async function login() {
    const em = emailInput.trim().toLowerCase();
    if (!em || !em.includes("@")) return;
    const p = (await loadJSON("bl:user:" + em)) || { proficiency: {} };
    setEmail(em);
    setProfile(p);
    await saveJSON("bl:lastuser", { email: em });
    setStage("app");
  }

  /* ---- deal helpers ---- */
  function dealCard(excludeId) {
    if (!cardPool.length) { setCard(null); return; }
    const next = pickCard(cardPool, profile.proficiency, excludeId);
    setCard(next);
    setTier(next.type === "cloze" ? "fallback" : "front");
    setClozeVals([]); setClozeResults([]); setMcqPick(null); setStamp(null); setRevealed(false);
  }
  function dealBlurt(excludeId) {
    if (!blurtPool.length) { setBlurt(null); return; }
    const next = pickCard(blurtPool, profile.proficiency, excludeId);
    setBlurt(next);
    setBlurtText(""); setBlurtPhase("write"); setHits([]);
    setSecs(300); setRunning(false);
  }
  function dealLadder(excludeId) {
    if (!ladderPool.length) { setLadder(null); return; }
    const next = pickCard(ladderPool, profile.proficiency, excludeId);
    setLadder(next);
    setCountGuess(""); setLPhase("count");
    setSlotVals(new Array(next.slots.length).fill(""));
    setLResults(null);
  }

  /* ---- drill grading (unchanged behaviour) ---- */
  function gradeCloze(text) {
    const parts = parseCloze(text).filter((p) => p.t === "blank");
    const results = parts.map((p, i) => norm(clozeVals[i]) === norm(p.v) && norm(clozeVals[i]) !== "");
    const allRight = results.every(Boolean);
    setClozeResults(results);
    setTier("graded");
    if (card.type === "cloze") {
      if (allRight) { record(card.id, up(card.id), true); setStamp({ text: "CORRECT", good: true }); }
      else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); }
    } else {
      if (allRight) { record(card.id, Math.max(1, profile.proficiency[card.id] ?? 0), true); setStamp({ text: "HOLDS", good: true }); }
      else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); }
    }
    setRevealed(true);
  }
  function gradeMcq(idx) {
    setMcqPick(idx); setTier("graded");
    if (idx === card.correct) { record(card.id, up(card.id), true); setStamp({ text: "CORRECT", good: true }); }
    else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); }
    setRevealed(true);
  }
  function knowIt() { record(card.id, up(card.id), true); setStamp({ text: "KNOWN", good: true }); setTier("graded"); setRevealed(true); }
  function needHelp() {
    if (card.fallback) setTier("fallback");
    else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); setTier("graded"); setRevealed(true); }
  }

  /* ---- blurt scoring ---- */
  function finishBlurt() { setRunning(false); setBlurtPhase("score"); }
  function commitBlurt() {
    const n = hits.filter(Boolean).length;
    const total = blurt.components.length;
    if (n === total) record(blurt.id, up(blurt.id), true);
    else if (n / total >= 0.6) record(blurt.id, Math.max(1, Math.min(3, profile.proficiency[blurt.id] ?? 1)), false);
    else record(blurt.id, 0, false);
    setBlurtPhase("done");
  }

  /* ---- ladder grading ---- */
  function gradeLadder() {
    const used = new Array(ladder.slots.length).fill(false);
    const matched = slotVals.map((txt) => {
      const t = norm(txt);
      if (!t) return -1;
      for (let i = 0; i < ladder.slots.length; i++) {
        if (used[i]) continue;
        if (ladder.slots[i].keywords.some((k) => t.includes(norm(k)))) { used[i] = true; return i; }
      }
      return -1;
    });
    setLResults({ matched, used });
    setLPhase("graded");
    const got = used.filter(Boolean).length;
    if (got === ladder.slots.length) record(ladder.id, up(ladder.id), true);
    else if (got >= Math.ceil(ladder.slots.length * 0.6)) record(ladder.id, Math.max(1, Math.min(3, profile.proficiency[ladder.id] ?? 1)), false);
    else record(ladder.id, 0, false);
  }
  function overrideSlot(i) {
    const nr = { ...lResults, used: [...lResults.used] };
    nr.used[i] = !nr.used[i];
    setLResults(nr);
    const got = nr.used.filter(Boolean).length;
    if (got === ladder.slots.length) bump(ladder.id);
    else if (got < Math.ceil(ladder.slots.length * 0.6)) setProf(ladder.id, 0);
  }

  /* ---- stats over the active pool ---- */
  const activePool = mode === "blurt" ? blurtPool : mode === "ladder" ? ladderPool : cardPool;
  const stats = useMemo(() => {
    let mastered = 0, learning = 0, pile = 0, fresh = 0;
    activePool.forEach((c) => {
      const p = profile.proficiency[c.id];
      if (p === undefined) fresh++;
      else if (p === 0) pile++;
      else if (p <= 3) learning++;
      else mastered++;
    });
    return { mastered, learning, pile, fresh };
  }, [activePool, profile]);

  const prof = card ? profile.proficiency[card.id] : undefined;
  const mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  /* ================= render ================= */

  if (stage === "loading") return <div className="desk"><style>{CSS}</style><div className="loadmsg">Opening the pad…</div></div>;

  if (stage === "login")
    return (
      <div className="desk"><style>{CSS}</style>
        <div className="loginwrap">
          <div className="folder">
            <div className="folder-tab">CASE FILE</div>
            <h1 className="brand">Black Letter</h1>
            <p className="tagline">Rule drilling, blank-page recall, and attack outlines for 1Ls.</p>
            <label className="loglabel" htmlFor="em">Email</label>
            <input id="em" className="login-input" value={emailInput} placeholder="you@school.edu"
              onChange={(e) => setEmailInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} autoComplete="email" />
            <button className="btn btn-ink" onClick={login}>Open my pad</button>
            <p className="fineprint">Progress is keyed to this email on this device. No password — don't store anything private.</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="desk">
      <style>{CSS}</style>

      <header className="topbar">
        <span className="brand-sm">Black Letter</span>
        <nav className="tabs">
          {[["drill", "Drill"], ["blurt", "Blurt"], ["ladder", "Ladder"], ["browse", "Browse"], ["attack", "Attack"], ["stats", "Progress"]].map(([k, label]) => (
            <button key={k} className={"tab " + (mode === k ? "tab-on" : "")} onClick={() => setMode(k)}>{label}</button>
          ))}
        </nav>
        <span className="whoami">{email} · <button className="linkbtn" onClick={() => { setStage("login"); setEmailInput(""); }}>switch</button></span>
      </header>

      <div className="subrow">
        <button className={"chip " + (subject === "mixed" ? "chip-on" : "")} onClick={() => setSubject("mixed")}>
          Mixed <span className="chip-note">interleaved</span>
        </button>
        {subjectKeys.map((k) => (
          <button key={k} className={"chip " + (subject === k ? "chip-on" : "")} onClick={() => setSubject(k)}>{DECK[k].name}</button>
        ))}
      </div>

      {mode !== "attack" && mode !== "stats" && mode !== "browse" && (
        <div className="statsrow">
          <span className="stat"><b>{stats.mastered}</b> mastered</span>
          <span className="stat"><b>{stats.learning}</b> learning</span>
          <span className="stat stat-red"><b>{stats.pile}</b> study pile</span>
          <span className="stat stat-dim"><b>{stats.fresh}</b> new</span>
        </div>
      )}

      {/* ================= DRILL ================= */}
      {mode === "drill" && (
        !card ? (
          <Pad empty><p className="empty-msg">No cards here yet.<br />Send an outline and this deck fills itself.</p></Pad>
        ) : (
          <Pad>
            <div className="cardmeta">
              <span className="concept">{subject === "mixed" ? DECK[card._s].name + " · " : ""}{card.concept}</span>
              <span className={"proftag " + (prof === 0 ? "proftag-red" : prof >= 4 ? "proftag-green" : "")}>{profLabel(prof)}</span>
            </div>

            {card.type === "flash" && tier === "front" && (
              <>
                <p className="prompt">{card.prompt}</p>
                <div className="btnrow">
                  <button className="btn btn-green" onClick={knowIt}>I know it</button>
                  <button className="btn btn-ink" onClick={needHelp}>Need help</button>
                </div>
              </>
            )}

            {tier === "fallback" && (
              <>
                {card.type === "flash" && <p className="prompt prompt-sm">{card.prompt}</p>}
                <ClozeLine parts={parseCloze(card.type === "cloze" ? card.text : card.fallback)}
                  values={clozeVals} setValues={setClozeVals} graded={false} results={[]} lineHeight="34px" />
                <div className="btnrow">
                  <button className="btn btn-ink" onClick={() => gradeCloze(card.type === "cloze" ? card.text : card.fallback)}>Check answers</button>
                </div>
                {card.type === "flash" && <p className="hintnote">Fill every blank. Wrong or empty sends this to the study pile.</p>}
              </>
            )}

            {card.type === "mcq" && tier !== "graded" && (
              <>
                <p className="prompt prompt-sm">{card.scenario}</p>
                <div className="mcqlist">
                  {card.options.map((o, i) => (
                    <button key={i} className="mcq" onClick={() => gradeMcq(i)}>
                      <span className="mcq-letter">{String.fromCharCode(65 + i)}</span> {o}
                    </button>
                  ))}
                </div>
              </>
            )}

            {tier === "graded" && (
              <div className="gradedwrap">
                {stamp && <div className={"stamp " + (stamp.good ? "stamp-green" : "stamp-red")}>{stamp.text}</div>}

                {card.type === "mcq" && (
                  <>
                    <p className="prompt prompt-sm">{card.scenario}</p>
                    <div className="mcqlist">
                      {card.options.map((o, i) => (
                        <div key={i} className={"mcq mcq-done " + (i === card.correct ? "mcq-right" : i === mcqPick ? "mcq-wrong" : "")}>
                          <span className="mcq-letter">{String.fromCharCode(65 + i)}</span> {o}
                        </div>
                      ))}
                    </div>
                    <p className="explain">{card.explanation}</p>
                  </>
                )}

                {card.type !== "mcq" && revealed && (
                  <>
                    {clozeResults.length > 0 && (
                      <ClozeLine parts={parseCloze(card.type === "cloze" ? card.text : card.fallback)}
                        values={clozeVals} setValues={setClozeVals} graded={true} results={clozeResults} lineHeight="34px" />
                    )}
                    {card.type === "flash" && (
                      <div className="answerblock">
                        {(Array.isArray(card.answer) ? card.answer : [card.answer]).map((l, i) => (
                          <p key={i} className="answerline">{l}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {card.why && <p className="why"><span className="whylabel">Why it matters:</span> {card.why}</p>}

                <div className="btnrow">
                  <button className="btn btn-ink" onClick={() => dealCard(card.id)}>Next card</button>
                  {stamp && stamp.text === "KNOWN" && (
                    <button className="btn btn-demote" onClick={() => { setProf(card.id, 0); setStamp({ text: "STUDY PILE", good: false }); }}>
                      Actually missed it → study pile
                    </button>
                  )}
                </div>
              </div>
            )}
          </Pad>
        )
      )}

      {/* ================= BLURT ================= */}
      {mode === "blurt" && (
        !blurt ? (
          <Pad empty><p className="empty-msg">No blurt topics for this subject yet.</p></Pad>
        ) : (
          <Pad>
            <div className="cardmeta">
              <span className="concept">{subject === "mixed" ? DECK[blurt._s].name + " · " : ""}blank page</span>
              <span className={"proftag " + (profile.proficiency[blurt.id] === 0 ? "proftag-red" : profile.proficiency[blurt.id] >= 4 ? "proftag-green" : "")}>
                {profLabel(profile.proficiency[blurt.id])}
              </span>
            </div>

            <h2 className="blurt-topic">{blurt.topic}</h2>

            {blurtPhase === "write" && (
              <>
                <p className="hintnote hint-top">Notes closed. Write everything you can produce — rule statement, elements, exceptions, cases. Finish the whole blurt before checking.</p>
                <textarea className="blurtbox" value={blurtText} onChange={(e) => setBlurtText(e.target.value)}
                  placeholder="Write the rule from memory…" spellCheck="false" />
                <div className="btnrow">
                  {!running ? (
                    <button className="btn btn-green" onClick={() => setRunning(true)}>Start 5:00</button>
                  ) : (
                    <span className="timer">{mmss(secs)}</span>
                  )}
                  <button className="btn btn-ink" onClick={finishBlurt}>Done — show me the checklist</button>
                </div>
              </>
            )}

            {blurtPhase !== "write" && (
              <>
                <div className="yourblurt">
                  <div className="yb-label">What you wrote</div>
                  <pre className="yb-text">{blurtText || "(nothing)"}</pre>
                </div>

                <div className="checklist">
                  <div className="cl-label">Did you produce each of these? Be honest — this feeds the weighting.</div>
                  {blurt.components.map((c, i) => (
                    <button key={i} className={"clitem " + (hits[i] ? "clitem-on" : "")}
                      disabled={blurtPhase === "done"}
                      onClick={() => { const h = [...hits]; h[i] = !h[i]; setHits(h); }}>
                      <span className="clbox">{hits[i] ? "✓" : ""}</span> {c}
                    </button>
                  ))}
                  <div className="clscore">{hits.filter(Boolean).length} / {blurt.components.length}</div>
                </div>

                {blurtPhase === "score" && (
                  <div className="btnrow"><button className="btn btn-ink" onClick={commitBlurt}>Score it &amp; show the model</button></div>
                )}

                {blurtPhase === "done" && (
                  <>
                    <div className="model">
                      <div className="model-label">Model answer</div>
                      {blurt.model.map((l, i) => <p key={i} className="modelline">{l}</p>)}
                    </div>
                    <div className="btnrow">
                      <button className="btn btn-ink" onClick={() => dealBlurt(blurt.id)}>Next topic</button>
                      <button className="btn btn-green" onClick={() => { setBlurtText(""); setHits([]); setBlurtPhase("write"); setSecs(90); setRunning(true); }}>
                        Re-blurt this now (1:30)
                      </button>
                    </div>
                    <p className="hintnote">The re-blurt is the part most people skip — it confirms the patch actually took.</p>
                  </>
                )}
              </>
            )}
          </Pad>
        )
      )}

      {/* ================= LADDER ================= */}
      {mode === "ladder" && (
        !ladder ? (
          <Pad empty><p className="empty-msg">No ladders for this subject yet.</p></Pad>
        ) : (
          <Pad>
            <div className="cardmeta">
              <span className="concept">{subject === "mixed" ? DECK[ladder._s].name + " · " : ""}{ladder.concept}</span>
              <span className={"proftag " + (profile.proficiency[ladder.id] === 0 ? "proftag-red" : profile.proficiency[ladder.id] >= 4 ? "proftag-green" : "")}>
                {profLabel(profile.proficiency[ladder.id])}
              </span>
            </div>

            <p className="prompt prompt-sm">{ladder.prompt}</p>

            {lPhase === "count" && (
              <>
                <p className="hintnote hint-top">First: how many? Getting the count right is the scaffold that stops you producing three of four on an exam.</p>
                <div className="countrow">
                  <input className="countbox" value={countGuess} inputMode="numeric"
                    onChange={(e) => setCountGuess(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && countGuess && setLPhase("fill")} placeholder="#" />
                  <button className="btn btn-ink" disabled={!countGuess} onClick={() => setLPhase("fill")}>Lock it in</button>
                </div>
              </>
            )}

            {lPhase !== "count" && (
              <>
                <p className={"countverdict " + (Number(countGuess) === ladder.slots.length ? "cv-good" : "cv-bad")}>
                  You said {countGuess} — there are {ladder.slots.length}.
                </p>
                {ladder.slots.map((s, i) => (
                  <div key={i} className="slotrow">
                    <span className="slotnum">{i + 1}</span>
                    <input className={"slotbox " + (lPhase === "graded" ? (lResults.matched[i] >= 0 ? "slot-hit" : "slot-miss") : "")}
                      value={slotVals[i]} disabled={lPhase === "graded"}
                      onChange={(e) => { const v = [...slotVals]; v[i] = e.target.value; setSlotVals(v); }}
                      placeholder={"Element " + (i + 1)} />
                  </div>
                ))}

                {lPhase === "fill" && (
                  <div className="btnrow"><button className="btn btn-ink" onClick={gradeLadder}>Check</button></div>
                )}

                {lPhase === "graded" && (
                  <>
                    <div className="slotkey">
                      {ladder.slots.map((s, i) => (
                        <div key={i} className={"keyrow " + (lResults.used[i] ? "keyrow-hit" : "keyrow-miss")}>
                          <span className="keymark">{lResults.used[i] ? "✓" : "✗"}</span>
                          <span className="keylabel">{s.label}</span>
                          <button className="keytoggle" onClick={() => overrideSlot(i)}>
                            {lResults.used[i] ? "mark missed" : "I had this"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="btnrow"><button className="btn btn-ink" onClick={() => dealLadder(ladder.id)}>Next ladder</button></div>
                  </>
                )}
              </>
            )}
          </Pad>
        )
      )}

      {/* ================= BROWSE ================= */}
      {mode === "browse" && (
        <BrowseView subject={subject} subjectKeys={subjectKeys} proficiency={profile.proficiency} />
      )}

      {/* ================= PROGRESS ================= */}
      {mode === "stats" && (
        <StatsView subject={subject} subjectKeys={subjectKeys} profile={profile} setSubject={setSubject} />
      )}

      {/* ================= ATTACK OUTLINE ================= */}
      {mode === "attack" && (
        <div className="attackwrap">
          {(subject === "mixed" ? subjectKeys : [subject]).map((k) =>
            ATTACK[k] ? <AttackCard key={k} data={ATTACK[k]} /> : null
          )}
        </div>
      )}

      <p className="deskfoot">
        {mode === "drill" && "Weighted draw: study-pile items surface ~36× more often than mastered ones."}
        {mode === "blurt" && "Free recall beats review. Blurt → check → patch → re-blurt."}
        {mode === "ladder" && "Count first, then fill. Unordered grading — say it however you'd write it."}
        {mode === "browse" && "Read-only. Nothing here changes your proficiency."}
        {mode === "attack" && "This is the page you memorize. Blurt from these headings."}
        {mode === "stats" && "Accuracy counts every graded attempt; proficiency reflects where you stand now."}
      </p>
    </div>
  );
}

/* ---------- small presentational pieces ---------- */

function Pad({ children, empty }) {
  return (
    <div className={"pad " + (empty ? "pad-empty" : "")}>
      <div className="pad-binding" />
      <div className="pad-inner">{children}</div>
    </div>
  );
}

function AttackCard({ data }) {
  const [open, setOpen] = useState({});
  return (
    <div className="pad attack-pad">
      <div className="pad-binding" />
      <div className="pad-inner">
        <h2 className="attack-title">{data.title}</h2>
        {data.sections.map((s, i) => {
          const isOpen = open[i] !== false;
          return (
            <div key={i} className="asec">
              <button className="ahead" onClick={() => setOpen({ ...open, [i]: !isOpen })}>
                <span className="acaret">{isOpen ? "▾" : "▸"}</span> {s.h}
              </button>
              {isOpen && (
                <ul className="alist">
                  {s.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ---------- browse (read-only) ---------- */

function clozeFilled(text) {
  return parseCloze(text).map((p, i) =>
    p.t === "txt" ? <span key={i}>{p.v}</span> : <b key={i} className="fillword">{p.v}</b>
  );
}

function BrowseItem({ item, kind, prof }) {
  const [open, setOpen] = useState(false);
  const title =
    kind === "blurt" ? item.topic :
    kind === "ladder" ? item.concept :
    item.concept;
  return (
    <div className="bitem">
      <button className="bhead" onClick={() => setOpen(!open)}>
        <span className="bcaret">{open ? "▾" : "▸"}</span>
        <span className="btitle">{title}</span>
        <span className={"bdot " + (prof === undefined ? "d-new" : prof === 0 ? "d-pile" : prof <= 3 ? "d-learn" : "d-mast")} />
      </button>

      {open && (
        <div className="bbody">
          {kind === "card" && item.type === "cloze" && (
            <p className="bline">{clozeFilled(item.text)}</p>
          )}

          {kind === "card" && item.type === "flash" && (
            <>
              <p className="bq">{item.prompt}</p>
              {(Array.isArray(item.answer) ? item.answer : [item.answer]).map((l, i) => (
                <p key={i} className="bline">{l}</p>
              ))}
            </>
          )}

          {kind === "card" && item.type === "mcq" && (
            <>
              <p className="bq">{item.scenario}</p>
              {item.options.map((o, i) => (
                <p key={i} className={"bopt " + (i === item.correct ? "bopt-right" : "")}>
                  {String.fromCharCode(65 + i)}. {o}
                </p>
              ))}
              <p className="bline">{item.explanation}</p>
            </>
          )}

          {kind === "blurt" && (
            <>
              <p className="bq">Should contain:</p>
              <ul className="blist">{item.components.map((c, i) => <li key={i}>{c}</li>)}</ul>
              {item.model.map((l, i) => <p key={i} className="bline">{l}</p>)}
            </>
          )}

          {kind === "ladder" && (
            <>
              <p className="bq">{item.prompt}</p>
              <ol className="blist">{item.slots.map((s, i) => <li key={i}>{s.label}</li>)}</ol>
            </>
          )}

          {item.why && <p className="bwhy"><span className="whylabel">Why it matters:</span> {item.why}</p>}
        </div>
      )}
    </div>
  );
}

function BrowseView({ subject, subjectKeys, proficiency }) {
  const [filter, setFilter] = useState("all");
  const keys = subject === "mixed" ? subjectKeys : [subject];

  const keep = (id) => {
    const p = proficiency[id];
    if (filter === "all") return true;
    if (filter === "pile") return p === 0;
    if (filter === "unmastered") return p === undefined || p < 4;
    return true;
  };

  return (
    <div className="attackwrap">
      <div className="filterrow">
        {[["all", "Everything"], ["unmastered", "Not yet mastered"], ["pile", "Study pile only"]].map(([k, l]) => (
          <button key={k} className={"fchip " + (filter === k ? "fchip-on" : "")} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {keys.map((k) => {
        const cards = DECK[k].cards.filter((c) => keep(c.id));
        const blurts = (BLURTS[k] || []).filter((b) => keep(b.id));
        const ladders = (LADDERS[k] || []).filter((l) => keep(l.id));
        if (!cards.length && !blurts.length && !ladders.length) return null;
        return (
          <div className="pad attack-pad" key={k}>
            <div className="pad-binding" />
            <div className="pad-inner">
              <h2 className="attack-title">{DECK[k].name}</h2>

              {blurts.length > 0 && (
                <>
                  <div className="bgroup">Blurt topics · {blurts.length}</div>
                  {blurts.map((b) => <BrowseItem key={b.id} item={b} kind="blurt" prof={proficiency[b.id]} />)}
                </>
              )}

              {ladders.length > 0 && (
                <>
                  <div className="bgroup">Element ladders · {ladders.length}</div>
                  {ladders.map((l) => <BrowseItem key={l.id} item={l} kind="ladder" prof={proficiency[l.id]} />)}
                </>
              )}

              {cards.length > 0 && (
                <>
                  <div className="bgroup">Cards · {cards.length}</div>
                  {cards.map((c) => <BrowseItem key={c.id} item={c} kind="card" prof={proficiency[c.id]} />)}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- progress ---------- */

function Bar({ counts }) {
  const total = counts.mastered + counts.learning + counts.pile + counts.fresh || 1;
  const pct = (n) => (n / total) * 100 + "%";
  return (
    <div className="bar">
      <div className="seg seg-mast" style={{ width: pct(counts.mastered) }} />
      <div className="seg seg-learn" style={{ width: pct(counts.learning) }} />
      <div className="seg seg-pile" style={{ width: pct(counts.pile) }} />
      <div className="seg seg-new" style={{ width: pct(counts.fresh) }} />
    </div>
  );
}

function countFor(items, proficiency) {
  let mastered = 0, learning = 0, pile = 0, fresh = 0;
  items.forEach((i) => {
    const p = proficiency[i.id];
    if (p === undefined) fresh++;
    else if (p === 0) pile++;
    else if (p <= 3) learning++;
    else mastered++;
  });
  return { mastered, learning, pile, fresh, total: items.length };
}

function StatsView({ subject, subjectKeys, profile, setSubject }) {
  const proficiency = profile.proficiency || {};
  const attempts = profile.stats || {};
  const days = profile.days || {};
  const keys = subject === "mixed" ? subjectKeys : [subject];

  const itemsFor = (k) => [
    ...DECK[k].cards.map((c) => ({ ...c, _kind: "card", _s: k, _t: c.concept })),
    ...(BLURTS[k] || []).map((b) => ({ ...b, _kind: "blurt", _s: k, _t: b.topic })),
    ...(LADDERS[k] || []).map((l) => ({ ...l, _kind: "ladder", _s: k, _t: l.concept })),
  ];
  const all = keys.flatMap(itemsFor);
  const overall = countFor(all, proficiency);

  let seen = 0, right = 0;
  all.forEach((i) => { const a = attempts[i.id]; if (a) { seen += a.seen; right += a.right; } });
  const acc = seen ? Math.round((right / seen) * 100) : null;

  /* last 14 days of activity */
  const dayList = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    dayList.push({ k, n: days[k] || 0, label: d.getDate() });
  }
  const peak = Math.max(1, ...dayList.map((d) => d.n));

  /* streak of consecutive days ending today */
  let streak = 0;
  for (let i = dayList.length - 1; i >= 0; i--) { if (dayList[i].n > 0) streak++; else break; }

  /* weakest — study pile, most-attempted first */
  const weakest = all
    .filter((i) => proficiency[i.id] === 0)
    .sort((a, b) => ((attempts[b.id] || {}).seen || 0) - ((attempts[a.id] || {}).seen || 0))
    .slice(0, 12);

  const untouched = all.filter((i) => proficiency[i.id] === undefined).length;

  return (
    <div className="attackwrap">
      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">Where you stand</h2>

          <div className="bignums">
            <div className="bignum"><b>{overall.mastered}</b><span>mastered</span></div>
            <div className="bignum"><b>{overall.learning}</b><span>learning</span></div>
            <div className="bignum bn-red"><b>{overall.pile}</b><span>study pile</span></div>
            <div className="bignum bn-dim"><b>{untouched}</b><span>untouched</span></div>
          </div>

          <Bar counts={overall} />
          <div className="legend">
            <span><i className="sw seg-mast" /> mastered</span>
            <span><i className="sw seg-learn" /> learning</span>
            <span><i className="sw seg-pile" /> study pile</span>
            <span><i className="sw seg-new" /> not yet seen</span>
          </div>

          <div className="metricrow">
            <div className="metric"><b>{acc === null ? "—" : acc + "%"}</b><span>accuracy over {seen} graded attempts</span></div>
            <div className="metric"><b>{streak}</b><span>day{streak === 1 ? "" : "s"} in a row</span></div>
          </div>
        </div>
      </div>

      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">Last 14 days</h2>
          <div className="spark">
            {dayList.map((d, i) => (
              <div className="sparkcol" key={i}>
                <div className="sparkbar" style={{ height: Math.max(3, (d.n / peak) * 88) + "px" }} title={d.n + " attempts"} />
                <span className="sparklabel">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="hintnote">Bars are graded attempts per day. Short daily sessions beat long weekly ones.</p>
        </div>
      </div>

      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">By subject</h2>
          {subjectKeys.map((k) => {
            const c = countFor(itemsFor(k), proficiency);
            const pct = c.total ? Math.round((c.mastered / c.total) * 100) : 0;
            return (
              <div className="subjrow" key={k}>
                <div className="subjhead">
                  <button className="subjname" onClick={() => setSubject(k)}>{DECK[k].name}</button>
                  <span className="subjpct">{pct}% mastered · {c.total} items</span>
                </div>
                <Bar counts={c} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">Work on these next</h2>
          {weakest.length === 0 ? (
            <p className="empty-msg2">Nothing in the study pile{subject === "mixed" ? "" : " for " + DECK[subject].name}. Either you're in good shape or you haven't been honest with the demote button.</p>
          ) : (
            weakest.map((i) => {
              const a = attempts[i.id] || { seen: 0, right: 0 };
              return (
                <div className="weakrow" key={i.id}>
                  <span className="weakkind">{i._kind}</span>
                  <span className="weakname">{i._t}</span>
                  <span className="weakstat">{a.right}/{a.seen}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Public+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

* { box-sizing: border-box; margin: 0; }

.desk {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 50% -10%, #3a352a 0%, #262218 55%, #1c1913 100%);
  font-family: 'Public Sans', system-ui, sans-serif;
  color: #efe9d8;
  display: flex; flex-direction: column; align-items: center;
  padding: 0 16px 48px;
}

.loadmsg { margin-top: 40vh; font-family: 'IBM Plex Mono', monospace; color: #b8ad8f; }

/* ---- login ---- */
.loginwrap { display:flex; align-items:center; justify-content:center; min-height:100vh; width:100%; }
.folder {
  position: relative;
  background: #d9c69a;
  color: #2b2416;
  border-radius: 4px 10px 10px 10px;
  padding: 44px 40px 32px;
  width: min(420px, 94vw);
  box-shadow: 0 24px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.35);
}
.folder-tab {
  position:absolute; top:-26px; left:0;
  background:#d9c69a; padding:6px 22px 4px;
  border-radius:8px 8px 0 0;
  font-family:'IBM Plex Mono', monospace; font-size:12px; letter-spacing:.18em;
  color:#6d5c35;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
}
.brand {
  font-family:'Libre Caslon Text', Georgia, serif;
  font-size:42px; font-weight:700; letter-spacing:-.01em; line-height:1.05;
}
.tagline { margin:10px 0 26px; color:#5d5238; font-size:15px; }
.loglabel { display:block; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:#6d5c35; margin-bottom:6px; font-weight:700;}
.login-input {
  width:100%; padding:12px 14px; font-size:16px;
  border:2px solid #8a7748; border-radius:6px; background:#f7efd8; color:#2b2416;
  font-family:'Public Sans', sans-serif; margin-bottom:16px;
}
.login-input:focus { outline:3px solid #23355C; outline-offset:1px; }
.fineprint { margin-top:14px; font-size:12px; color:#7c6c47; line-height:1.5; }

/* ---- top chrome ---- */
.topbar {
  width:min(860px,100%); display:flex; align-items:center; gap:18px;
  padding:18px 4px 10px; flex-wrap:wrap;
}
.brand-sm { font-family:'Libre Caslon Text', Georgia, serif; font-weight:700; font-size:20px; color:#e8dfc6; }
.tabs { display:flex; gap:6px; flex:1; }
.tab {
  background:transparent; color:#b8ad8f; border:1px solid #4a4433;
  padding:7px 14px; border-radius:20px; font-size:13px; font-weight:600;
  cursor:pointer; font-family:'Public Sans', sans-serif;
}
.tab-on { background:#e8dfc6; color:#2b2416; border-color:#e8dfc6; }
.tab:focus-visible, .btn:focus-visible, .mcq:focus-visible, .linkbtn:focus-visible { outline:3px solid #d8c98f; outline-offset:2px; }
.whoami { font-size:12px; color:#8f8468; font-family:'IBM Plex Mono', monospace; }
.linkbtn { background:none; border:none; color:#c9b877; cursor:pointer; font:inherit; text-decoration:underline; padding:0; }

.statsrow { width:min(860px,100%); display:flex; gap:18px; padding:2px 4px 18px; font-size:13px; flex-wrap:wrap; }
.stat { color:#b8ad8f; } .stat b { color:#e8dfc6; font-family:'IBM Plex Mono', monospace; }
.stat-red b { color:#e08a7c; } .stat-dim b { color:#8f8468; }

/* ---- the legal pad ---- */
.pad {
  width:min(760px,100%);
  transform: rotate(-.35deg);
  filter: drop-shadow(0 26px 40px rgba(0,0,0,.5));
  animation: dealIn .32s cubic-bezier(.2,1.1,.4,1);
}
@keyframes dealIn { from { opacity:0; transform: translateY(14px) rotate(-.35deg);} to { opacity:1; transform: translateY(0) rotate(-.35deg);} }
@media (prefers-reduced-motion: reduce) { .pad { animation:none; } .stamp { animation:none !important; } }

.pad-binding {
  height:22px; border-radius:8px 8px 0 0;
  background: repeating-linear-gradient(90deg, #574a33 0 14px, #6a5a3e 14px 28px);
  box-shadow: inset 0 -3px 5px rgba(0,0,0,.35);
}
.pad-inner {
  position:relative;
  background:
    repeating-linear-gradient(to bottom, transparent 0 33px, rgba(120,160,200,.45) 33px 34px),
    linear-gradient(#fbf3c9, #f6ecb8);
  color:#23355C;
  padding: 40px 34px 34px 92px;
  min-height: 340px;
  border-radius: 0 0 6px 6px;
}
.pad-inner::before {
  content:""; position:absolute; top:0; bottom:0; left:64px;
  border-left:2px solid rgba(194,74,63,.75);
  box-shadow: 4px 0 0 -1px rgba(194,74,63,.45);
}
@media (max-width:560px){
  .pad-inner { padding:32px 20px 28px 58px; }
  .pad-inner::before { left:38px; }
}

.cardmeta { display:flex; justify-content:space-between; align-items:baseline; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
.concept {
  font-family:'IBM Plex Mono', monospace; font-size:12px; letter-spacing:.08em;
  color:#8a6d1f; text-transform:uppercase;
}
.proftag {
  font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:.12em;
  color:#6b7f9c; border:1px solid currentColor; padding:2px 8px; border-radius:3px;
}
.proftag-red { color:#b03a2e; } .proftag-green { color:#2f7d46; }

.prompt {
  font-family:'Libre Caslon Text', Georgia, serif;
  font-size:22px; line-height:34px; margin-bottom:22px;
}
.prompt-sm { font-size:18px; line-height:30px; }

.clozewrap {
  font-family:'Libre Caslon Text', Georgia, serif;
  font-size:18px; margin-bottom:20px;
}
.blankspan { white-space:nowrap; }
.blank {
  font-family:'Public Sans', sans-serif; font-size:15px; font-weight:600;
  border:none; border-bottom:2px solid #23355C; background:rgba(255,255,255,.35);
  color:#23355C; padding:2px 6px; margin:0 2px; border-radius:2px 2px 0 0;
}
.blank:focus { outline:none; background:#fff; border-bottom-color:#8a6d1f; }
.blank-right { border-bottom-color:#2f7d46; color:#2f7d46; background:rgba(47,125,70,.08); }
.blank-wrong { border-bottom-color:#b03a2e; color:#b03a2e; text-decoration:line-through; background:rgba(176,58,46,.07); }
.reveal { color:#2f7d46; font-weight:700; font-family:'Public Sans', sans-serif; font-size:15px; }

.btnrow { display:flex; gap:12px; margin-top:8px; flex-wrap:wrap; }
.btn {
  font-family:'Public Sans', sans-serif; font-weight:700; font-size:15px;
  padding:11px 22px; border-radius:6px; cursor:pointer; border:2px solid transparent;
}
.btn-ink { background:#23355C; color:#fbf3c9; }
.btn-ink:hover { background:#1a2946; }
.btn-green { background:#2f7d46; color:#fbf3c9; }
.btn-green:hover { background:#266a3a; }
.btn-demote { background:transparent; color:#b03a2e; border-color:#b03a2e; }
.btn-demote:hover { background:rgba(176,58,46,.08); }
.hintnote { margin-top:14px; font-size:13px; color:#8a6d1f; font-style:italic; }

.mcqlist { display:flex; flex-direction:column; gap:10px; margin-bottom:18px; }
.mcq {
  text-align:left; font-family:'Public Sans', sans-serif; font-size:15px; line-height:1.45;
  background:rgba(255,255,255,.4); color:#23355C;
  border:1.5px solid #9db0c9; border-radius:6px; padding:11px 14px; cursor:pointer;
}
.mcq:hover { background:#fff; border-color:#23355C; }
.mcq-letter { font-family:'IBM Plex Mono', monospace; font-weight:600; color:#8a6d1f; margin-right:6px; }
.mcq-done { cursor:default; }
.mcq-right { border-color:#2f7d46; background:rgba(47,125,70,.12); }
.mcq-wrong { border-color:#b03a2e; background:rgba(176,58,46,.10); }

.gradedwrap { position:relative; }
.stamp {
  position:absolute; top:-18px; right:-6px; z-index:2;
  font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:20px; letter-spacing:.14em;
  padding:6px 16px; border:3px solid currentColor; border-radius:4px;
  transform: rotate(-12deg);
  animation: stampIn .26s cubic-bezier(.2,1.5,.45,1);
  background: transparent;
  opacity: .55;
  pointer-events: none;
}
.stamp-green { color:#2f7d46; } .stamp-red { color:#b03a2e; }
@keyframes stampIn { from { transform: rotate(-12deg) scale(1.7); opacity:0; } to { transform: rotate(-12deg) scale(1); opacity:1; } }

.answerblock { margin:6px 0 4px; }
.answerline { font-family:'Libre Caslon Text', Georgia, serif; font-size:17px; line-height:34px; }
.explain { font-size:15px; line-height:1.6; margin-bottom:10px; }
.why { margin-top:16px; font-size:14px; line-height:1.6; color:#5d5f3e; border-top:1px dashed rgba(138,109,31,.5); padding-top:12px; }
.whylabel { font-weight:700; color:#8a6d1f; text-transform:uppercase; font-size:11px; letter-spacing:.1em; margin-right:6px; }

.pad-empty .pad-inner { display:flex; align-items:center; justify-content:center; }
.empty-msg { font-family:'Libre Caslon Text', Georgia, serif; font-size:19px; text-align:center; line-height:1.7; color:#6b6a52; }

.deskfoot { margin-top:22px; font-size:12px; color:#6f664e; font-family:'IBM Plex Mono', monospace; }

/* ---- mode + subject chrome ---- */
.subrow { width:min(860px,100%); display:flex; gap:8px; flex-wrap:wrap; padding:0 4px 12px; }
.chip {
  background:transparent; color:#b8ad8f; border:1px dashed #4a4433;
  padding:6px 13px; border-radius:16px; font-size:12.5px; font-weight:600; cursor:pointer;
  font-family:'Public Sans', sans-serif;
}
.chip-on { background:#3d4f2f; color:#e8dfc6; border-style:solid; border-color:#5d7346; }
.chip-note { font-family:'IBM Plex Mono', monospace; font-size:10px; opacity:.65; margin-left:5px; letter-spacing:.06em; }

/* ---- blurt ---- */
.blurt-topic {
  font-family:'Libre Caslon Text', Georgia, serif; font-size:30px; line-height:1.2;
  margin-bottom:14px; color:#23355C;
}
.hint-top { margin-top:0; margin-bottom:14px; }
.blurtbox {
  width:100%; min-height:230px; resize:vertical;
  background:transparent; border:none; outline:none;
  font-family:'Libre Caslon Text', Georgia, serif; font-size:18px; line-height:34px;
  color:#23355C; padding:0;
}
.blurtbox::placeholder { color:#9aa6b8; font-style:italic; }
.timer {
  font-family:'IBM Plex Mono', monospace; font-size:26px; font-weight:600; color:#b03a2e;
  align-self:center; letter-spacing:.04em;
}
.yourblurt { margin-bottom:20px; }
.yb-label, .cl-label, .model-label {
  font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:.12em;
  text-transform:uppercase; color:#8a6d1f; margin-bottom:8px;
}
.yb-text {
  font-family:'Libre Caslon Text', Georgia, serif; font-size:16px; line-height:30px;
  white-space:pre-wrap; margin:0; color:#4a5570;
  border-left:3px solid rgba(138,109,31,.4); padding-left:14px;
}
.checklist { margin-bottom:18px; }
.clitem {
  display:flex; align-items:flex-start; gap:10px; width:100%; text-align:left;
  background:transparent; border:none; cursor:pointer; padding:7px 0;
  font-family:'Public Sans', sans-serif; font-size:15px; line-height:1.45; color:#4a5570;
  border-bottom:1px solid rgba(120,160,200,.28);
}
.clitem:disabled { cursor:default; }
.clitem-on { color:#2f7d46; font-weight:600; }
.clbox {
  flex:none; width:19px; height:19px; margin-top:1px; border:2px solid #9db0c9; border-radius:3px;
  display:flex; align-items:center; justify-content:center; font-size:13px; color:#2f7d46; font-weight:700;
}
.clitem-on .clbox { border-color:#2f7d46; background:rgba(47,125,70,.12); }
.clscore { font-family:'IBM Plex Mono', monospace; font-size:15px; color:#8a6d1f; margin-top:12px; font-weight:600; }
.model { margin:6px 0 4px; border-top:1px dashed rgba(138,109,31,.5); padding-top:14px; }
.modelline { font-family:'Libre Caslon Text', Georgia, serif; font-size:16px; line-height:30px; margin-bottom:12px; }

/* ---- ladder ---- */
.countrow { display:flex; gap:12px; align-items:center; margin-bottom:8px; }
.countbox {
  width:76px; font-family:'IBM Plex Mono', monospace; font-size:24px; text-align:center;
  border:none; border-bottom:2px solid #23355C; background:rgba(255,255,255,.4);
  color:#23355C; padding:6px; border-radius:3px 3px 0 0;
}
.countbox:focus { outline:none; background:#fff; border-bottom-color:#8a6d1f; }
.countverdict { font-family:'IBM Plex Mono', monospace; font-size:13px; margin-bottom:16px; }
.cv-good { color:#2f7d46; } .cv-bad { color:#b03a2e; }
.slotrow { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.slotnum { font-family:'IBM Plex Mono', monospace; font-size:13px; color:#8a6d1f; width:16px; flex:none; }
.slotbox {
  flex:1; font-family:'Public Sans', sans-serif; font-size:15px;
  border:none; border-bottom:2px solid #9db0c9; background:rgba(255,255,255,.35);
  color:#23355C; padding:7px 9px; border-radius:2px 2px 0 0;
}
.slotbox:focus { outline:none; background:#fff; border-bottom-color:#8a6d1f; }
.slot-hit { border-bottom-color:#2f7d46; background:rgba(47,125,70,.08); }
.slot-miss { border-bottom-color:#b03a2e; background:rgba(176,58,46,.07); }
.slotkey { margin-top:18px; border-top:1px dashed rgba(138,109,31,.5); padding-top:14px; }
.keyrow { display:flex; align-items:baseline; gap:9px; padding:6px 0; font-size:15px; line-height:1.45; }
.keymark { font-family:'IBM Plex Mono', monospace; font-weight:700; flex:none; }
.keyrow-hit .keymark { color:#2f7d46; } .keyrow-miss .keymark { color:#b03a2e; }
.keyrow-miss .keylabel { color:#b03a2e; }
.keylabel { flex:1; }
.keytoggle {
  flex:none; background:none; border:none; cursor:pointer; text-decoration:underline;
  font-family:'IBM Plex Mono', monospace; font-size:11px; color:#7c6c47; padding:0;
}

/* ---- attack outline ---- */
.attackwrap { width:min(760px,100%); display:flex; flex-direction:column; gap:26px; }
.attack-pad { transform: rotate(-.2deg); }
.attack-title { font-family:'Libre Caslon Text', Georgia, serif; font-size:27px; margin-bottom:18px; color:#23355C; }
.asec { margin-bottom:14px; }
.ahead {
  background:none; border:none; cursor:pointer; padding:0 0 6px; text-align:left; width:100%;
  font-family:'Public Sans', sans-serif; font-weight:700; font-size:16px; color:#8a6d1f;
}
.acaret { font-size:12px; margin-right:5px; }
.alist { margin:0 0 4px; padding-left:22px; }
.alist li {
  font-family:'Libre Caslon Text', Georgia, serif; font-size:15.5px; line-height:30px;
  color:#23355C; margin-bottom:2px;
}


/* ---- browse ---- */
.filterrow { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:2px; }
.fchip {
  background:transparent; color:#b8ad8f; border:1px solid #4a4433; padding:6px 13px;
  border-radius:16px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:'Public Sans', sans-serif;
}
.fchip-on { background:#e8dfc6; color:#2b2416; border-color:#e8dfc6; }
.bgroup {
  font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase;
  color:#8a6d1f; margin:22px 0 8px; padding-bottom:5px; border-bottom:1px solid rgba(138,109,31,.35);
}
.bgroup:first-of-type { margin-top:4px; }
.bitem { border-bottom:1px solid rgba(120,160,200,.3); }
.bhead {
  display:flex; align-items:center; gap:9px; width:100%; text-align:left; cursor:pointer;
  background:none; border:none; padding:11px 0;
  font-family:'Public Sans', sans-serif; font-size:15px; font-weight:600; color:#23355C;
}
.bcaret { font-size:11px; color:#8a6d1f; flex:none; }
.btitle { flex:1; }
.bdot { flex:none; width:9px; height:9px; border-radius:50%; }
.d-mast { background:#2f7d46; } .d-learn { background:#c9a227; }
.d-pile { background:#b03a2e; } .d-new { background:#9db0c9; }
.bbody { padding:2px 0 16px 20px; }
.bq { font-family:'Public Sans', sans-serif; font-size:14.5px; font-weight:600; color:#5d5238; margin-bottom:9px; line-height:1.5; }
.bline { font-family:'Libre Caslon Text', Georgia, serif; font-size:16px; line-height:29px; margin-bottom:10px; }
.fillword { color:#2f7d46; border-bottom:2px solid rgba(47,125,70,.45); }
.blist { margin:0 0 12px; padding-left:20px; }
.blist li { font-family:'Public Sans', sans-serif; font-size:14.5px; line-height:1.65; color:#4a5570; }
.bopt { font-family:'Public Sans', sans-serif; font-size:14.5px; line-height:1.55; margin-bottom:5px; color:#4a5570; }
.bopt-right { color:#2f7d46; font-weight:600; }
.bwhy { margin-top:10px; font-size:13.5px; line-height:1.6; color:#5d5f3e; }

/* ---- progress ---- */
.bignums { display:flex; gap:26px; flex-wrap:wrap; margin-bottom:20px; }
.bignum { display:flex; flex-direction:column; }
.bignum b { font-family:'IBM Plex Mono', monospace; font-size:34px; line-height:1; color:#2f7d46; }
.bignum span { font-size:12px; color:#6b6a52; margin-top:5px; }
.bignum:nth-child(2) b { color:#8a6d1f; }
.bn-red b { color:#b03a2e !important; } .bn-dim b { color:#8794a8 !important; }
.bar { display:flex; height:13px; border-radius:7px; overflow:hidden; background:rgba(120,160,200,.25); margin-bottom:10px; }
.seg { height:100%; }
.seg-mast { background:#2f7d46; } .seg-learn { background:#c9a227; }
.seg-pile { background:#b03a2e; } .seg-new { background:#9db0c9; }
.legend { display:flex; gap:15px; flex-wrap:wrap; font-size:12px; color:#6b6a52; margin-bottom:20px; }
.legend span { display:flex; align-items:center; gap:5px; }
.sw { width:10px; height:10px; border-radius:2px; display:inline-block; }
.metricrow { display:flex; gap:30px; flex-wrap:wrap; border-top:1px dashed rgba(138,109,31,.5); padding-top:16px; }
.metric { display:flex; flex-direction:column; }
.metric b { font-family:'IBM Plex Mono', monospace; font-size:25px; color:#23355C; line-height:1; }
.metric span { font-size:12px; color:#6b6a52; margin-top:5px; }
.spark { display:flex; align-items:flex-end; gap:5px; height:110px; margin-bottom:8px; }
.sparkcol { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; }
.sparkbar { width:100%; background:#23355C; border-radius:3px 3px 0 0; min-height:3px; }
.sparklabel { font-family:'IBM Plex Mono', monospace; font-size:9.5px; color:#8794a8; margin-top:5px; }
.subjrow { margin-bottom:20px; }
.subjhead { display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin-bottom:7px; flex-wrap:wrap; }
.subjname {
  background:none; border:none; padding:0; cursor:pointer; text-align:left;
  font-family:'Public Sans', sans-serif; font-weight:700; font-size:16px; color:#23355C; text-decoration:underline;
}
.subjpct { font-family:'IBM Plex Mono', monospace; font-size:12px; color:#6b6a52; }
.weakrow { display:flex; align-items:baseline; gap:11px; padding:8px 0; border-bottom:1px solid rgba(120,160,200,.28); }
.weakkind {
  flex:none; width:52px; font-family:'IBM Plex Mono', monospace; font-size:10px;
  letter-spacing:.08em; text-transform:uppercase; color:#8a6d1f;
}
.weakname { flex:1; font-size:15px; line-height:1.4; color:#23355C; }
.weakstat { flex:none; font-family:'IBM Plex Mono', monospace; font-size:12px; color:#b03a2e; }
.empty-msg2 { font-family:'Libre Caslon Text', Georgia, serif; font-size:16px; line-height:1.65; color:#6b6a52; }

`;
