# Donations in Oradea Drive

Researched 2026-10-30. This is research, not legal advice. Section 9 lists what a Romanian accountant or lawyer should confirm.

## Recommendation

Yes, raise donations, but as a free directory and a seasonal campaign, not as Oleg's pay-for-content shop. Add a vetted "ONG-uri și biserici din Oradea" layer: small NGOs and churches of every denomination, each with a short story and links to its own donation page and its Formular 230 (3.5%) page. Run it hard in the 3.5% season, 1 March – 25 May 2027. The game never holds money or checks receipts. Keep building requests free with an optional thank-you gift to a listed NGO. List Drumul Vieții on equal terms with a plain disclosure. Sell nothing to businesses until a lawyer has looked at it: under Legea 32/1994 a sponsor may be named, not advertised.

## Needs you first

| # | Action | Owner | By |
|---|---|---|---|
| 1 | Decide the goal: money for Drumul Vieții, or more giving to small Oradea causes. The design differs (section 2). | Alexander | 15 Jan 2027, so the layer ships before 1 March |
| 2 | Ask Fundația Comunitară Oradea to vet the list or co-host it (section 2). | Alexander | 15 Jan 2027 |
| 3 | Measure the audience first. Turn on Cloudflare Web Analytics for oradea.drumulvietii.ro if it is still off (an open item in the fork notes of 22 Oct). Build nothing past step 2 of section 6 without a month of numbers. | Alexander | now |
| 4 | If Mobiversal sponsors Drumul Vieții under a contract, have a lawyer review its partner card first (section 3, row 3). | Alexander | before any contract is signed |

## 1. Fit verdict: good for civic pride and recognition, weak as a money engine

Donation-for-content fits a city game and an NGO founder as a way to show local causes and thank people. It does not raise much money on its own. The best evidence is Oleg's own first month.

| Evidence | What it shows | Source and date |
|---|---|---|
| Oleg's bot, issues #1–#56, 29 Sep – 27 Oct 2026: 5 paid improvement requests filed (#1, #2, #3, #6, #35); 3 donations confirmed, 50 + 50 + 500 UAH = 600 UAH (about €12 at the NBU rate of 50.68 UAH/€ on 30 Oct 2026). #6 never paid. One ad request (#48, van livery) was abandoned. No ad was bought through the bot. | Low yield even with a mandatory minimum of 50 UAH. | [issues](https://github.com/OlegPasko/cherkasy-drive/issues), read with `gh` 2026-10-30; [NBU rate](https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&date=20261030&json) |
| In the same month at least 18 free requests were built: #12, #20, #21, #22, #24–#30, #34, #38, #40, #44, #45, #47, #49. | Free requests got the same result as paid ones, so paying had little point. Requests are an engagement tool more than a revenue tool. | `AGENTS.md` and `src/world/cherkasy/places.js` in this repo (issue numbers cited there) |
| Cherkasy has four ad partners (U space, Everlabs, Торс, URBAN). None came through the bot's issues. | Whether they paid, and how much, is not public. | `src/world/cherkasy/places.js`; issue list above |
| Oleg's jar is a private person's monobank jar (owner "Олександр З."). | Do not copy this in Romania: money for a public cause should land in the registered organisation's own account. I found no Romanian rule on this either way; ask the accountant. | `bot/packages/default/driver_bot/texts.js` |
| Large charity gaming: Games Done Quick passed $60M over 15 years ([Shacknews, July 2026](https://www.shacknews.com/article/149991/summer-games-done-quick-2026-keeps-things-steady-with-24m-raised-for-doctors-without-borders), seen via search); Humble passed $250M ([Feb 2024](https://www.gamedeveloper.com/press-release/humble-bundle-surpasses-250-million-raised-for-charitable-causes-around-the-globe), seen via search); Extra Life reports over $145M since 2008 ([extra-life.org/about](https://www.extra-life.org/about), undated, seen via search only). | They work through a fixed time window, a public running total, a reward or public credit, and a very large audience. Oradea Drive has the first three within reach, not the audience. | as linked |
| Overwatch "Pink Mercy": a $15 cosmetic sold for two weeks, 100% to charity, raised $12.7M. | Cosmetic recognition inside a game can move money, at scale. | [Blizzard, July 2018](https://overwatch.blizzard.com/ru-ru/news/21931801), seen via search |
| Recognition: a field experiment with 4,168 prior donors found that offering public recognition raised giving, mainly for social image. | Donor credit in the game should help a little. | Karlan & McConnell, JEBO 106 (2014), [NBER w17737](https://www.nber.org/papers/w17737), seen via search |
| Why people give: eight mechanisms (need, solicitation, costs and benefits, altruism, reputation, psychological benefits, values, efficacy). A 2024 review found efficacy, costs, solicitation and psychological benefits replicate best; reputation less well. | Show what a gift does (efficacy), make it cheap (3.5% costs nothing), ask directly. Do not lean on status. | [Bekkers & Wiepking, NVSQ 2011](https://journals.sagepub.com/doi/10.1177/0899764010380927); [Bekkers, 7 Nov 2024](https://rogue-scholar.org/records/rm7vy-k4b83), both seen via search |
| Romanian donors: 48% gave in the past year; 54% of donors give up to 50 lei a month. Channels: 3.5% redirection 38%, goods 33%, bank transfer 30%, cash 30%, SMS 24%, online card 20%. 88% want to know how money is used. | The 3.5% form is the most used channel and the cheapest ask. A card-only flow reaches the smallest group. | Raiffeisen Bank and Appinio, [Economedia, 29 June 2026](https://economedia.ro/studiu-1-din-2-romani-a-donat-pentru-o-cauza-sociala-in-ultimul-an.html) (sample size not given) |
| Trust: about half of Romanians trust NGOs; the share with no trust in NGOs rose from 14% (2016) to 27% (2025). Trust in the Church is about four in five. | Vetting and transparency are part of the product. | FDSC BOSC 2025, [Edupedu, 10 Feb 2026](https://www.edupedu.ro/mai-multi-romani-au-incredere-in-ong-uri-decat-in-sindicate-sau-politicieni-studiu-fdsc/) |
| Oradea already gives to a multi-cause local campaign: Swimathon Oradea raised over 900,000 lei for 16 causes in 2024, 550,000 lei for 14 in 2025, and over 570,000 lei for 24 in 2026 (provisional). In 2026 single causes ranged from 1,200 to 78,891 lei. | A shared local campaign with an event works here. Causes with their own supporters raise most. | Fundația Comunitară Oradea: [16 June 2024](https://fundatiacomunitaraoradea.ro/swimathon-oradea-2024-a-demonstrat-ca-ne-facem-bine/), [5 June 2025](https://fundatiacomunitaraoradea.ro/ce-a-insemnat-swimathon-oradea-2025/), [9 June 2026](https://fundatiacomunitaraoradea.ro/swimathon-oradea-2026-a-transformat-solidaritatea-in-valuri-de-bine/); [project list](https://swimathonoradea.ro/proiecte), read 2026-10-30 |
| Donor-written content: a Kickstarter backer's epitaph in Pillars of Eternity was read as transphobic and patched out. | Anything donors write or submit needs moderation before it ships. | [Kotaku, April 2015](https://kotaku.com/pillars-of-eternity-fan-text-changed-after-player-compl-1695608446), seen via search |
| In-game business placement is sold as advertising elsewhere: McDonald's Japan paid to make about 3,000 restaurants Pokémon GO locations. | "Put my business in the game" is an ad product, not a gift. | [TechCrunch, 21 July 2016](https://techcrunch.com/2016/07/21/pokemon-go-is-finally-available-in-japan), seen via search |

What motivates each group:

- **Individuals:** the cause, and seeing it work. Public credit helps a little. The cheapest ask is the 3.5% form, which costs them nothing.
- **Businesses:** promotion. Since 2024 micro-enterprises get no sponsorship tax credit (section 3), so for most small Oradea firms a "donation for a placement" is really an ad purchase.
- **Players:** seeing their own street, school or church in the game. Oleg's data says they ask for it gladly and rarely pay.

## 2. Whom to fund: a short vetted list with Drumul Vieții on it, not alone

**Recommendation:** list 8–12 small Oradea NGOs and churches per season, Drumul Vieții among them, vetted by someone other than Drumul Vieții. Each listed organisation brings its own supporters to the game, so the list also grows the audience.

**Evidence on competition between causes:**

- Big appeals lift giving to the appealing charity, with no later offset. Gifts to other charities move earlier in time and are offset later, so the others are not shown to lose in the long run. Scharf, Smith & Ottoni-Wilhelm, AEJ: Economic Policy 14(3), 2022, [AEA](https://www.aeaweb.org/doi/10.1257/pol.20180679) (abstract seen via search).
- Matching grants raised giving to matched requests on DonorsChoose and did not crowd out similar requests, then or later. Meer, J. Public Economics 145 (2017), [NBER w22033, Feb 2016](https://www.nber.org/papers/w22033).
- More competing similar projects cut each project's chance of being funded. Meer, [NBER w19082, May 2013](https://www.nber.org/papers/w19082). So keep similar asks apart and feature few at a time.
- In a lab study with hypothetical €50 winnings, total giving rose with the number of recipients, at a decreasing rate. People gave more to organisations they knew. Forcing a single recipient lowered giving. Soyer & Hogarth, Judgment and Decision Making 6(7), Oct 2011, [PDF](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/80522EE22A6D7523C7FD2D51A30DA498/S1930297500002655a.pdf/the-size-and-distribution-of-donations-effects-of-number-of-recipients.pdf).
- Swimathon Oradea (section 1): 14–24 causes a year, 550,000–900,000 lei a year.

Conclusion: a short list should raise more in total than Drumul Vieții alone, and Drumul Vieții loses little by sharing the stage.

**How to run it fairly:**

- **Equal format.** Same card, same ring, random order on every load. One entry per legal entity. A "featured" slot rotates by lottery. Never rank by money raised.
- **Fund projects, not denominations.** A church is listed for a social project (food, children, elderly, refugees). Service times can be a second line. Galantom excludes "religious propaganda" for the same reason ([requirements](https://start.galantom.ro/about/requirements), read 2026-10-30).
- **Balance.** Today four of the six partners are churches, three of them Baptist (Emanuel, BBSO, BSVO). No Orthodox, Catholic, Reformed or Jewish organisation is a partner (`src/world/oradea/places.js`). Invite every denomination with a congregation in Oradea. The recognised cults are listed in the annex to [Legea 489/2006](https://legeaz.net/legea-cultelor-489-2006/).
- **Vetting criteria:**
  1. a legal entity in Romania: an association, a foundation, or a unit of a recognised cult;
  2. listed in ANAF's Registrul entităților/unităților de cult (needed anyway for the 3.5% and sponsorship; check it through ANAF's public [web service](https://static.anaf.ro/static/10/Anaf/Informatii_R/index_cult_v2.html));
  3. active in Oradea or Bihor;
  4. a public annual report or activity summary;
  5. no party politics, no hate or discrimination;
  6. written consent to the card text and photos;
  7. its own donation page or IBAN.
- **Who vets:** first choice is Fundația Comunitară Oradea. It calls itself nonpartisan and not religiously affiliated, and it already runs Swimathon with rules and a project sign-up ([site](https://fundatiacomunitaraoradea.ro/), read 2026-10-30). Fallback: a three-person panel where Drumul Vieții has one seat at most.
- **Removal rule:** an organisation that leaves the ANAF register or faces a credible scandal is paused until reviewed.

**Disclose the conflict of interest.** The facts to disclose:

- Drumul Vieții runs the game. The start card already says so (`consentNote` in `src/world/oradea/config.js`).
- BCUO, a current partner, is run by Drumul Vieții (`src/world/oradea/places.js`).
- Mobiversal shares Drumul Vieții's registered address, Str. Thurzó Sándor 40 (ANAF web service, queried 2026-10-30), and its card says it supports the association.

Proposed text for the layer's legend, the start card and the foot of each card:

> RO: Oradea Drive este un proiect al Asociației Drumul Vieții (CIF 49189680). Drumul Vieții apare și ea în această listă, în aceleași condiții ca celelalte organizații. Listarea este gratuită, ordinea este aleatorie, iar jocul nu primește și nu păstrează bani: donațiile merg direct la organizații.
>
> EN: Oradea Drive is a project of the Drumul Vieții association (CIF 49189680). Drumul Vieții is also on this list, on the same terms as everyone else. Listing is free, the order is random, and the game never receives or holds money: donations go straight to each organisation.

## 3. Romanian law and tax checklist

Fiscal Code citations are from ANAF's consolidated text ("ultima actualizare: Legea nr. 204/2026"), [Cod_fiscal_norme_2023.htm](https://static.anaf.ro/static/10/Anaf/legislatie/Cod_fiscal_norme_2023.htm), read 2026-10-30.

| # | Topic | Current rule | Source | What it means here |
|---|---|---|---|---|
| 1 | Individuals: 3.5% redirection (Formular 230) | Up to 3.5% of the income tax on **salary income** (art. 123¹(1) refers only to art. 78(6) and 82(6)). Since income year 2024 the older rules for other incomes apply only to 2023 income (transitional para. (28)). Deadline 25 May of the next year (art. 122(3)), so 25 May 2027 for 2026 income. A request can cover the same beneficiary for 2 years (art. 123¹(3)). It can be filed with the NGO, which sends ANAF a centralising form electronically (art. 123¹(3¹)). The beneficiary must be in the ANAF register when paid (art. 123¹(2)). | Fiscal Code, ANAF text above | The main ask. Worth about 200 lei a year per employee on the average wage. My estimate: INS July 2026 gross 9,709 lei, net 5,820 lei, so income tax is about 491 lei a month ([Profit.ro](https://www.profit.ro/taxe-si-consultanta/ce-salarii-au-romanii-castigul-salarial-mediu-brut-a-crescut-la-9-709-lei-domeniile-cu-cele-mai-mari-salarii-22720367), seen via search). Free online forms: [redirectioneaza.ro](https://redirectioneaza.ro/) (Code for Romania; 6,092 organisations, 71,923 forms in 2026, read 2026-10-30) and [formular230.ro](https://formular230.ro/drumul-vietii) (Drumul Vieții already uses it). One guide ([eduact.ro, March 2026](https://eduact.ro/cine-poate-redirectiona-3-5-din-impozitul-pe-venit/), seen via search) says pensioners and the self-employed can still redirect. The Code text says salary only. Accountant to confirm. |
| 2 | Company sponsorship and its tax credit | Profit-tax payers deduct sponsorship from profit tax up to the lower of 0.75% of turnover and 20% of profit tax (art. 25(4)(i)). For NGOs and cult units this applies only if the beneficiary is in the Registrul entităților/unităților de cult **on the contract date** (same article). Entry conditions are in art. 25(4¹). Unused room can be redirected with form 177 by the profit-tax return deadline (25 June 2026 for 2025) under ANAF Order 3562/2024 ([Contzilla, 29 May 2026](https://www.contzilla.ro/redirectionare-impozitului-pentru-sponsorizari-modificari-2026/)). Sponsors report beneficiaries on form D107 ([Fiscalitatea](https://www.fiscalitatea.ro/microintreprindere-in-2026-mai-trebuie-sa-depuneti-d107-daca-efectuati-sponsorizari-24699/), seen via search). **Micro-enterprises:** 2023 was the last year sponsorship could be deducted from micro tax (art. 56(25)). A micro-enterprise has revenue up to €100,000 (art. 47(1)(c)). | Fiscal Code; Contzilla | Only larger firms get a tax benefit. Most small Oradea businesses would sponsor out of goodwill or for promotion. Drumul Vieții is in the register since 26 Mar 2025 (ANAF web service, queried 2026-10-30), and its [sponsorship page](https://drumulvietii.ro/sustine/) already offers a pre-filled contract. |
| 3 | Sponsorship vs advertising | The sponsorship contract is written, with object, value and duration (Legea 32/1994 art. 1(2)). The sponsor or beneficiary may make the sponsorship public "prin promovarea numelui, a mărcii sau a imaginii sponsorului" (art. 5(1)). Announcements must make the sponsorship clear and are published free by the beneficiary (art. 5(4)). Commercial advertising for the sponsor within sponsorship activities is banned (art. 5(5)). | [Legea 32/1994](https://legislatie.just.ro/Public/DetaliiDocument/4058), consolidated 3 Sep 2018 | A sponsor can get "Susține: [NGO]" with its name or logo. A card with a sales pitch, services, hours and offers, given in exchange for money, is advertising. That breaches art. 5(5) inside a sponsorship and may cost the deduction. Today's Mobiversal card lists its services ("Custom software and AI for small and mid-size firms"). That is fine while unpaid. If Mobiversal sponsors Drumul Vieții, a lawyer should review the card. |
| 4 | Selling ads | Ads sold for money are a service. The seller must be a legal entity that invoices. NGOs with economic activity must use RO e-Factura since 1 July 2025 ([ZiarulProfit](https://www.ziarulprofit.ro/e-factura-obligatorie-pentru-ong-uri-partide-politice-si-culte-religioase-de-la-1-iulie-2025-anaf-ameninta-cu-sanctiuni-serioase/), seen via search). Drumul Vieții is not in the RO e-Factura register and not VAT-registered (ANAF web service, 30 Oct 2026). VAT applies only above 395,000 lei turnover (art. 310(1)). NGO income from economic activity is tax-free up to €15,000 a year and 10% of exempt income (art. 15(3)). Ad income is fully exempt only for public-utility NGOs in culture, research, education, sport or health (art. 15(2)(l)). For cult units, economic income used for cult purposes is exempt (art. 15(1)(a)). | Fiscal Code; ANAF web service | Possible, but it is a business line with invoices, e-Factura and accounting. Not a donation. Do not sell as a private person. Postpone until a business asks. |
| 5 | Receipts | Gifts and sponsorship received by NGOs are non-taxable income (art. 15(2)(e)), and so are sums received from the 3.5% (art. 15(2)(o)). I found no tax deduction for individuals who give directly. Their tax route is the 3.5% form. | Fiscal Code | For individuals a "receipt" is a thank-you plus the bank or processor confirmation. Sponsorship needs the contract plus proof of payment. Cash gifts need an NGO receipt under accounting rules. I did not verify a statutory receipt format; accountant to confirm. |
| 6 | Public fundraising rules | I found no national licence for online fundraising by registered NGOs. I did not find the rules for street collections. **Pending:** bill L233/2026 (Senate adopted 18 May 2026; at the Chamber as Pl-x 414/2026) would make NGOs publish the identity of individual donors over 5,000 lei a year and all corporate donors, with suspension and dissolution for missing declarations. Status after May 2026 not verified. | [Edupedu, May 2026](https://www.edupedu.ro/world-vision-romania-cere-respingerea-propunerii-legislative-privind-finantarea-ong-rilor-proiectul-aduce-masuri-disproportionate-care-risca-sa-afecteze-copiii-vulnerabili-din-romania/); [Spotmedia, May 2026](https://spotmedia.ro/stiri/politica/senatul-a-votat-o-initiativa-aur-care-obliga-ong-urile-sa-faca-publice-toate-sursele-de-finantare-si-identitatea-donatorilor) (seen via search) | Linking out keeps the game outside any donor register. Watch L233/2026. |
| 7 | GDPR | GDPR plus Law 190/2018. Romania kept 16 as the age of digital consent ([Bird & Bird](https://childreninthedigitalworld.twobirds.com/home/romania), seen via search). | as linked | Collect only an email for status updates. Keep names out of public GitHub issues (Oleg's rule). Do not collect payment receipts: they carry names and IBANs. Show a donor's name only with explicit opt-in, and never for under-16s. |
| 8 | Children and advertising | Banned in all circumstances: "a direct exhortation to children to buy advertised products" or to ask parents to buy them (UCPD Annex I, point 28), and false "very limited time" claims (point 7). Romania transposed the directive through Legea 363/2007 (I did not check its text). The CPC network's key principles on in-game currencies (21 Mar 2025, soft law) ask games not to exploit children's vulnerabilities and to show real money values. | [Directive 2005/29/EC Annex I](https://www.legislation.gov.uk/eudr/2005/29/annex/I/adopted); [European Commission, 3 June 2025](https://commission.europa.eu/news-and-media/news/european-commission-hosts-stakeholders-talks-application-cpc-networks-key-principles-games-virtual-2025-06-03_en) | No donation or ad prompt that speaks to a child. Put asks on the website and in the map legend, not as pop-ups while driving. |
| 9 | Gambling | Gambling is a state monopoly ([OUG 77/2009 art. 1](https://legeaz.net/oug-77-2009-jocuri-de-noroc-organizare-exploatare/art-1)). | as linked | No raffles, random rewards or loot-box mechanics tied to a payment. |

## 4. Payment rails and platforms

| Rail | Cost | Fit | Source |
|---|---|---|---|
| 3.5% form via redirectioneaza.ro or formular230.ro | Free for donor and NGO (redirectioneaza says free; formular230 says free for donors) | Best. Salaried people only, until 25 May. | sites read 2026-10-30 |
| Bank transfer to the NGO's IBAN, with a reference | No processor fee; bank fees vary | Good. 30% of donors use transfers. Revolut has over 5 million Romanian customers with Romanian IBANs. | Raiffeisen study above; [Revistabiz, Sep 2026](https://www.revistabiz.ro/revolut-a-ajuns-la-5-milioane-de-clienti-in-romania-si-deschide-un-sediu-central-local-in-bucuresti/) |
| Stripe Payment Links into the NGO's own Stripe account | 1.5% + 1 leu per EEA card; 2.5% + 1 leu UK; 3.15% + 1 leu international, +2% if converted; Payment Links at no extra charge | Good for card donors. Each NGO owns its account, so the game never touches money. | [Stripe RO pricing](https://stripe.com/en-ro/pricing), read 2026-10-30 |
| Galantom | Form: Netopia 0.99% + VAT + 0.30 lei, plus Galantom 0.99%. Peer-to-peer: no Galantom fee (donor may tip). | Associations and foundations only. Excludes religious propaganda, so churches cannot use it. | [costs](https://start.galantom.ro/about/costs), [requirements](https://start.galantom.ro/about/requirements), read 2026-10-30 |
| Bursa Binelui (BCR) | Commission-free | Free listing, 982 organisations, 1,128 projects. Many projects on the home page showed 0 lei raised: a listing without your own audience brings little (my observation, anecdotal). | [bursabinelui.ro](https://www.bursabinelui.ro/), read 2026-10-30 |
| Donorbox | Standard: 2.95% platform fee plus Stripe or PayPal fees; Pro $150 a month at 1.75–2% | Works, but costs more than Stripe alone. Romanian specifics not checked. | [donorbox.org/pricing](https://donorbox.org/pricing), read 2026-10-30 |
| EuPlatesc or Netopia direct | By contract (not checked) | Fundația Comunitară Oradea and Swimathon use EuPlatesc. | FCO and Swimathon sites, read 2026-10-30 |
| SMS donations | Not researched | 24% of donors used SMS. Needs operator contracts. | Raiffeisen study above |

## 5. Mechanics, ranked by expected donations per day of work

I cannot put numbers on expected donations: the game's audience is unknown. The ranking uses the evidence above.

| Rank | Mechanic | Effort | Expected effect | Main risk |
|---|---|---|---|---|
| 1 | **3.5% season** (1 Mar – 25 May 2027): a start-card note, a chip, a "2 minutes, costs you nothing" card, and a city goal ("1,000 de formulare pentru Oradea") fed by the NGOs' own weekly counts | 1–2 days | Highest per day of work: the most used channel (38%) at zero cost to the donor, about 200 lei per form, and the 2-year option repeats it | Seasonal. Counts depend on NGOs reporting honestly. |
| 2 | **"ONG-uri și biserici" layer**: a ring, a generic sign and a card per organisation, with Donează (its own page), 3,5% (its form page) and Site; a legend item on the big map; random order | 2–3 days of code, then 1–2 hours per listing | Low to moderate money. Near-zero cost per extra listing. Each organisation shares the game, which brings players. | Neutrality and vetting (section 2) |
| 3 | **Free building requests with an optional thank-you**: "If you want to say thanks, give any amount to an organisation on the list". No minimum, no proof, no priority. | Half a day | Low. Oleg got 600 UAH in a month even with a mandatory minimum. | None worth noting |
| 4 | **Quest «Oradea care ajută»**: cards at NGO and church projects, each a real story told with consent | 2–4 days of content | Indirect. Builds awareness of need and shows efficacy, the drivers that replicate best. | Tone: no poverty voyeurism, consent of the people shown |
| 5 | **Web form instead of WhatsApp-only intake** (requests, ideas, NGO sign-up) creating GitHub issues, with email status updates | 4–6 days | Indirect. Needed once WhatsApp volume is too much for one person. | Spam (use Turnstile), personal data in public issues |
| 6 | **Sponsor credit**: "Susține: [NGO]" with a sponsor's name or logo at that NGO's building or on a billboard, under a contract between sponsor and NGO; a "Mulțumim" page for opt-in donors reported by the NGOs | 1–2 days, plus moderation each time | Moderate for profit-tax companies, low for individuals | Legea 32/1994 art. 5(5); GDPR consent; moderation |
| 7 | **A giving week** around 1 December (Romania's GivingTuesday runs as "Săptămâna Generozității", [Pressone](https://pressone.ro/givingtuesday-miscarea-globala-care-te-indeamna-sa-fii-generos-cu-totii-avem-ceva-de-dat), not checked for 2026) or a Swimathon tie-in, ideally with a sponsor matching gifts | 3–5 days plus finding a matcher | Could be the biggest single total. Matching raises giving without crowding out similar causes (Meer 2017). | Needs a reliable total and a matching contract |
| 8 | **Goal meter tied to real money** ("the city restored the theatre's lights") | 3–5 days, plus one collecting account with webhooks or manual NGO reports | Moderate | Conflict of interest if Drumul Vieții collects for others; regranting paperwork; temptation to fake urgency |
| 9 | **Paid business placement** (an ad sale) | Contract and invoicing work, plus a hand-built model per business (agent-hours each) | Unknown. Cherkasy sold none through its bot. | Section 3, row 4 |
| 10 | **Proof-of-donation checking** (port Oleg's `proof.js`) | 3–6 days plus model costs | Low. At this volume a person can check faster. | Receipts carry names and IBANs (GDPR); model errors |
| 11 | Payments, a virtual currency or random rewards inside the game | – | – | Do not build. |

**Avoid:**

- asks aimed at children, including "ask your parents";
- countdowns and false "last chance" claims;
- raffles, random prizes, loot boxes;
- pay-to-unlock gameplay (the Roadster must stay free);
- guilt or shame wording;
- donor leaderboards by amount, and ranking NGOs by money raised;
- pop-ups that interrupt driving, or repeat asks after a "no";
- pre-ticked boxes and default recurring gifts;
- photos of beneficiaries' children without written consent.

## 6. Implementation plan

1. **Measure (half a day, then 3–4 weeks of data).** Switch on Cloudflare Web Analytics if it is off. It counts visits, not clicks. The partner links already carry `utm_source=oradea.drumulvietii.ro`, so each NGO can see referrals in its own analytics.
2. **Policy and partners (owner time, about 2 weeks).** Write the criteria from section 2. Ask Fundația Comunitară Oradea. Invite 8–12 organisations across causes and denominations. Check each in the ANAF register. Get consent for text and photos.
3. **The layer (2–3 days).** The partner machinery already exists: a `TABLE` line in `src/world/oradea/sites/partners.js` plus a `places.js` entry gives a ring and a sign. Add a place kind `ngo`, or a flag on the current kind, with `donate` and `f230` links. Add a three-button card, the disclosure line and a big-map legend item. `src/game/partners.js` and the big map are upstream files, so keep the changes as `CITY`-guarded one-liners. Extend `tests/oradea-partners.test.mjs`.
4. **The 3.5% season (1–2 days, live by 1 March 2027).** A start-card note, a chip, a how-to card, and a goal meter read from a static JSON that you update weekly from the NGOs' counts. No tracking of individuals.
5. **The web form (4–6 days, when WhatsApp volume calls for it).** Add a route on the existing `oradea-drive` Worker. Use Turnstile against spam. Store photos in R2. File GitHub issues with no names in the body. Keep `{issue, email, language}` in KV or D1. A GitHub webhook (HMAC-checked) emails the requester on `in-progress` and on close. A status page works by code. Keep the WhatsApp link for chat.
6. **Quest cards (2–4 days of content).** Use the existing quest book format.
7. **Later, only on demand:** sponsor plaques, a matching week, ad sales through a proper legal entity.

Total: about 10–15 developer days for steps 3–6, plus owner time for steps 1–2.

**WhatsApp Business API: not now.** At current volume a person answering a `wa.me` link is cheaper. Since 1 Oct 2026 the first 1,000 service messages per number per month are free, non-profit service messages stay free beyond that through 31 Dec 2027, and utility replies inside the window are charged. Romania is its own rate market since 1 July 2026 ([Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing), read 2026-10-30). The cost is the setup: business verification, templates and a webhook.

**Running costs:**

| Item | Cost | Source |
|---|---|---|
| Workers | Free tier: 100,000 requests a day. Paid: $5 a month minimum. | [Cloudflare](https://developers.cloudflare.com/workers/platform/pricing/), read 2026-10-30 |
| Turnstile | Free, unlimited challenges | [Cloudflare](https://developers.cloudflare.com/turnstile/plans/), read 2026-10-30 |
| R2, D1, KV | Free tiers (R2 10 GB-month; D1 5 GB; KV 1 GB) | Cloudflare pricing, as above |
| GitHub issues, redirectioneaza.ro, formular230.ro | Free | – |
| Email for status updates | Not checked | – |
| Stripe, if an NGO adopts it | 1.5% + 1 leu per EEA card, paid by that NGO | Stripe RO pricing |

**What to reuse from Oleg's bot** (AGPL-3.0; it is already in this repo under `bot/`):

- the issue format, the labels and the privacy rule: no names or chat ids in public issues, and `//` comments stay internal (`bot/README.md`);
- `gh.js` (GitHub REST wrapper, 40 lines);
- the GitHub HMAC check in `index.js`;
- `place.js` (Google Maps links, short links, coordinates) and `geo.js` (Nominatim), with an Oradea bounding box;
- the moderation approach of `moderate.js`, but it needs a vision-model key (Oleg's first reader runs on his own Darkbloom nodes), so review images by hand at this volume.

Skip `tg.js`, the Telegram step machine in `bot.js`, `proof.js`, `jev.js` (an external guardrail service) and `news.js`. A web form is one POST handler, so the reuse is at the edges, not the core.

## 7. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Too few players for donations to matter | High until measured | Measure first. Keep the build to steps 3–4. |
| Seen as a Drumul Vieții fundraiser in disguise | Medium | Disclosure, outside vetting, equal format, random order |
| Seen as an evangelical project | Medium: three of the six partners are Baptist churches, and Drumul Vieții describes itself as a Christian association ([formular230.ro](https://formular230.ro/drumul-vietii)) | Invite all denominations. List projects, not worship. |
| Sponsorship with a pitch card counts as commercial advertising (Legea 32/1994 art. 5(5)) | Medium if businesses pay | Name or logo only, lawyer review |
| Personal data leaks through receipts, public issues or donor walls | Medium | Do not collect receipts. Anonymous issues. Opt-in names only, none for under-16s. |
| Asks reach children | Medium: game audiences skew young | No in-game prompts to children. Asks live on the website and in the legend. |
| Offensive donor or sponsor content | Low to medium | Human review before anything ships |
| A listed organisation in a scandal | Low | Removal rule, ANAF register check each season |
| L233/2026 passes and forces donor publication | Unknown | Link out. The game keeps no donor data. |
| Upstream merge pain | Low | `CITY`-guarded one-liners in shared files |

## 8. Open questions for the owner

1. Is the aim money for Drumul Vieții, or more giving to small Oradea causes?
2. Who vets the list: Fundația Comunitară Oradea, a panel, or you?
3. How many players, and how many are children? That decides whether any ask appears inside the game at all.
4. Is Mobiversal, or will it be, a sponsor of Drumul Vieții under a contract? If yes, its card should shrink to name, logo and "susține Drumul Vieții", or go to a lawyer first.
5. Should church cards keep service times, or show only the social project being funded?
6. Who answers requests and keeps the list current each season?
7. Should Drumul Vieții ever collect money for others (regranting)? I recommend linking out only.

## 9. For a Romanian accountant or lawyer

1. Since income year 2024, does the 3.5% apply only to salary income? The Code text says so; one 2026 guide says pensions and self-employment still qualify.
2. Is a free in-game listing of a sponsor's name, logo and website link "promoting the name, brand or image" (art. 5(1)) rather than commercial advertising (art. 5(5))? Is a card with business details, given to a sponsor, advertising?
3. When the sponsor gives to NGO X and the game (a Drumul Vieții project) shows the credit, does this satisfy art. 5(4), which says the beneficiary publishes the announcement?
4. Is a business that pays for its building to be rebuilt in the game buying a service (invoice, e-Factura, VAT position), whatever it is called?
5. Does a free building request with an optional, unconditional thank-you gift stay a gift? Does it become a sale if donors get priority?
6. Does Drumul Vieții's statute allow economic activity (ads) and regranting?
7. What receipt is needed for cash and online gifts, and for opt-in donor credit?
8. Is any authorisation needed for a campaign run by a game on behalf of several NGOs, online or in public spaces?
9. GDPR roles (Drumul Vieții as controller for the form, each NGO for its own donors). Is a DPIA needed given child players?
10. What is the current status of L233/2026 (Pl-x 414/2026)?

## 10. What to ask Oleg

1. The funnel behind the issues: players, bot starts, requests, paid conversions. Did the 50 UAH minimum cut requests?
2. Did U space, Everlabs, Торс and URBAN pay? How much, and were they sold through the bot or in person?
3. Building 18 free requests in a month likely undercut the paid track. Will he keep the paid track?
4. Proof-reader statistics: share auto-approved, share sent to manual review, any fraud attempts.
5. Any moderation incidents with ad artwork.
6. Is he happy for the form-to-issue parts of the bot to be reused, with credit? Would he take a channel-neutral core upstream (a web form next to Telegram)?

## Could not verify

- The Oradea Drive audience: size, age, traffic.
- Whether Oleg's four Cherkasy ad partners paid.
- Current status of L233/2026 after May 2026.
- Whether pensioners and the self-employed can still use the 3.5% (the Code text and one guide disagree).
- A statutory format for donation receipts; rules for street collections.
- EuPlatesc and Netopia direct rates, PayPal fees, SMS donation setup, Donorbox use from Romania.
- Whether redirectioneaza.ro accepts units of cult.
- Telegram vs WhatsApp usage shares in Romania. DataReportal shows Messenger ads reaching 7.3 million people in late 2025 ([Digital 2026: Romania](https://datareportal.com/reports/digital-2026-romania)), but gives no WhatsApp or Telegram figure.
- The final Swimathon Oradea 2026 total (570,000 lei was provisional on 9 June 2026).
- Some sources were seen only through search summaries; they are marked "seen via search" above.
