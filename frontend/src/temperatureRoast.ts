const roasts: [number, string[]][] = [
  [
    -30,
    [
      "Onko sulla testamentti?",
      "Elohopea luovutti",
      "Joulupukki muutti etelään",
      "Ilma sattuu",
    ],
  ],
  [
    -25,
    [
      "Diesel jäätyy, sinäkin kohta",
      "Ripset jäätyy kiinni",
      "Hengitys jäätyy ennen kuin osuu maahan",
      "Pakkasmittari itkee",
    ],
  ],
  [
    -20,
    [
      "T-paita kelpaa",
      "Ihan ok, jos ei liiku",
      "Naapurin auto ei käynnisty",
      "Koiralle tossut jalkaan",
    ],
  ],
  [
    -15,
    [
      "Nenäkarvat jäätyy, mutta kestää",
      "Melkein mukavaa",
      "Grillauskausi alkaa kohta",
      "Postilaatikko siirtyi sisälle",
    ],
  ],
  [
    -10,
    [
      "Ihan normaali talvipäivä",
      "Suomalainen peruslämpötila",
      "Talvitakki riittää... ehkä",
      "Kahvi jäähtyy nopeasti",
    ],
  ],
  [
    -5,
    [
      "Melkein lämmin",
      "Loskakausi lähestyy",
      "Ei tarvii pipon alle pipoa",
      "Kevään ensimmäiset merkit",
    ],
  ],
  [
    0,
    [
      "Nollakelillä liukastuu mummo",
      "Jää vai vesi? Kyllä.",
      "Luonto ei päätä mitä se haluaa",
      "Kaatumiskausi",
    ],
  ],
  [
    5,
    [
      "Kevät tulossa... ehkä",
      "Linnut harkitsee paluuta",
      "Takki vai ei? Molemmat väärin",
      "Räntäsade mahdollinen, todennäköinen, varma",
    ],
  ],
  [
    10,
    [
      "Shortsikeli jos on sisu",
      "Naapuri grillaa jo",
      "Suomalaisen kesäkuume alkaa",
      "Terassikausi avattu (rohkeille)",
    ],
  ],
  [
    15,
    [
      "Villapaitasää",
      "Suomen riviera",
      "Kyllä tässä pihalla pärjää",
      "Melkein t-paitakeli",
    ],
  ],
  [
    20,
    [
      "Kelpaa",
      "Hellevaroitus suomalaisittain",
      "Optimaalinen grillauslämpö",
      "Järvivesi kutsuu (melkein)",
    ],
  ],
  [
    25,
    [
      "Suomalainen helleaalto",
      "Tuuletin loppui Tokmannilta",
      "Kaikki järvet täynnä",
      "Ilmastointi? Mikä ilmastointi?",
    ],
  ],
  [
    30,
    [
      "Saunassa on viileämpää",
      "Asfaltti sulaa",
      "Jääkaappi on kodin paras huone",
      "Suomi sulaa",
    ],
  ],
  [
    Infinity,
    [
      "Virhe matriisissa, Suomessa ei ole näin lämmintä",
      "Muutetaanko Lappiin?",
      "Onko tämä edes laillista?",
      "Aurinko on liian lähellä",
    ],
  ],
];

export const getTemperatureRoast = (temp: number): string => {
  const bucket = roasts.find(([threshold]) => temp <= threshold)!;
  const options = bucket[1];
  return options[Math.floor(Math.random() * options.length)];
};
