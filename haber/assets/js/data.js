/* ==========================================================================
   data.js — Haber verisi (DEMO)
   --------------------------------------------------------------------------
   Tüm içerikler DEMO amaçlıdır; gerçek bir olayı veya gerçek bir haber
   kaynağını temsil etmez. Veri şeması, ileride Supabase gibi bir veritabanına
   geçildiğinde aynen korunacak şekilde tasarlanmıştır.

   Alanlar:
   id, title, slug, category, summary, content, image, imageAlt,
   sourceName, sourceUrl, sources[], publishedAt, status, tags[]
   Ek alanlar: isBreaking (son dakika), views (okunma), author, readingTime
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  /* --- Kategoriler ------------------------------------------------------ */
  NP.categories = {
    world: {
      key: "world",
      label: "Dünya",
      page: "pages/world.html",
      description:
        "Küresel gündem, diplomasi, ekonomi ve iklim başlıklarını bir arada sunan Dünya kategorisi."
    },
    turkey: {
      key: "turkey",
      label: "Türkiye",
      page: "pages/turkey.html",
      description:
        "Türkiye'nin gündemini, şehirlerini, eğitim ve ulaşım yatırımlarını takip eden Türkiye kategorisi."
    },
    technology: {
      key: "technology",
      label: "Teknoloji",
      page: "pages/technology.html",
      description:
        "Yapay zekâ, uzay, siber güvenlik ve otomasyon alanındaki gelişmeleri aktaran Teknoloji kategorisi."
    }
  };

  NP.categoryOrder = ["world", "turkey", "technology"];

  /* --- Haberler (DEMO) -------------------------------------------------- */
  NP.news = [
    {
      id: "demo-world-001",
      title: "Bölgesel iş birliği toplantısı ortak bildiriyle sona erdi",
      slug: "bolgesel-is-birligi-toplantisi-ortak-bildiri",
      category: "world",
      summary:
        "Üç gün süren toplantının ardından açıklanan bildiride iklim finansmanı, tedarik zincirleri ve dijital iş birliği başlıkları öne çıktı.",
      content: [
        {
          type: "p",
          text:
            "Başkentte düzenlenen ve üç gün süren bölgesel iş birliği toplantısı, katılımcı heyetlerin ortak bildiriyi kabul etmesiyle sona erdi. Toplantıya 14 ülkeden heyet başkanları, uluslararası kuruluş temsilcileri ve sivil toplum gözlemcileri katıldı."
        },
        {
          type: "p",
          text:
            "Bildiride, gelişmekte olan ülkelere yönelik iklim finansmanı mekanizmalarının genişletilmesi, kritik hammaddelerde tedarik zinciri çeşitlendirmesi ve araştırmacı hareketliliğinin kolaylaştırılması taahhütleri yer aldı."
        },
        { type: "h2", text: "Dijital iş birliği ayrı başlık olarak ele alındı" },
        {
          type: "p",
          text:
            "İlk kez ayrı bir çalışma grubunda ele alınan dijital iş birliği başlığında, kamu hizmetlerinde birlikte çalışabilirliğin artırılması ve yapay zekâ kullanımına ilişkin ortak ilkelerin hazırlanması kararlaştırıldı. Çalışma grubunun ilk raporunu gelecek yılın ilk çeyreğinde sunması bekleniyor."
        },
        {
          type: "p",
          text:
            "Heyet başkanları, basın toplantısında soruları yanıtladı ve alınan kararların uygulanmasını izlemek üzere bir takvim paylaştı. Toplantının bir sonraki turunun farklı bir üye ülkede yapılacağı duyuruldu."
        },
        { type: "h2", text: "Uzmanlar uygulama takvimine dikkat çekiyor" },
        {
          type: "p",
          text:
            "Toplantıyı izleyen uzmanlar, bildiride yer alan taahhütlerin somut adımlara dönüşmesi için takvimin netleştirilmesi gerektiğini belirtiyor. Özellikle iklim finansmanının hangi araçlarla sağlanacağı sorusu, önümüzdeki dönemde gündemde kalacak gibi görünüyor."
        },
        {
          type: "p",
          text:
            "Bu metin, haber portalının yayın şablonunu test etmek için hazırlanmış örnek bir içeriktir. Gerçek bir toplantıya, kuruma veya kişiye dayanmaz."
        }
      ],
      image: "assets/images/world-summit.jpg",
      imageAlt: "Uluslararası basın toplantısı salonunda mikrofonlar ve bayraklar",
      sourceName: "Demo Haber Merkezi",
      sourceUrl: "https://example.com/demo/bolgesel-is-birligi",
      sources: [
        {
          name: "Demo Haber Merkezi",
          url: "https://example.com/demo/bolgesel-is-birligi",
          note: "Örnek içerik kaynağı"
        },
        {
          name: "Demo Uluslararası Masası",
          url: "https://example.com/demo/uluslararasi-masa",
          note: "Örnek derleme kaynağı"
        }
      ],
      publishedAt: "2026-11-19T11:30:00+03:00",
      status: "published",
      tags: ["diplomasi", "iş birliği", "iklim"],
      isBreaking: false,
      views: 9820,
      author: "Demo Haber Merkezi"
    },
    {
      id: "demo-world-002",
      title: "İklim zirvesinde gelişmekte olan ülkeler için yeni fon tartışması",
      slug: "iklim-zirvesinde-yeni-fon-tartismasi",
      category: "world",
      summary:
        "Zirvenin ikinci gününde uyum projelerinin finansmanı ve fonların dağıtım ölçütleri masaya yatırıldı; taslak metin üzerinde çalışmalar sürüyor.",
      content: [
        {
          type: "p",
          text:
            "İklim zirvesinin ikinci gününde heyetler, uyum projelerine ayrılacak kaynağın büyüklüğü ve fonların ülkelere hangi ölçütlerle dağıtılacağı konusunu tartıştı. Görüşmelere katılan delegeler, taslak metnin büyük bölümünde uzlaşma sağlandığını ancak finansman başlığının açık kaldığını belirtiyor."
        },
        {
          type: "p",
          text:
            "Gelişmekte olan ülke heyetleri, tarım ve su yönetimi projelerinin iklim kaynaklı risklerden en çok etkilenen bölgelerde yoğunlaşması gerektiğini savunuyor. Bağışçı ülkeler ise kaynakların ölçülebilir sonuçlara bağlanması çağrısında bulunuyor."
        },
        { type: "h2", text: "Şehirler için ayrı bir pencere önerisi" },
        {
          type: "p",
          text:
            "Taslak metinde, yerel yönetimlerin doğrudan başvurabileceği ayrı bir fon penceresi oluşturulması da yer alıyor. Öneriye göre belediyeler, ulaşım ve yeşil altyapı projeleri için teknik destek ve düşük faizli finansmana erişebilecek."
        },
        {
          type: "p",
          text:
            "Zirve başkanlığı, metnin son gün yapılacak genel oturumda oylamaya sunulmasını planlıyor. Taslakta yer alan rakamların kesinleşmemesi nedeniyle ek bir uzatma oturumu ihtimali de değerlendiriliyor."
        },
        {
          type: "p",
          text:
            "Bu haber, portalın kategori ve detay şablonlarını denemek için oluşturulmuş DEMO bir içeriktir; gerçek bir zirve ya da anlaşma metnini aktarmaz."
        }
      ],
      image: "assets/images/world-climate.svg",
      imageAlt: "Gün doğumunda rüzgâr türbinleri ve güneş panelleri",
      sourceName: "Demo Haber Merkezi",
      sourceUrl: "https://example.com/demo/iklim-zirvesi",
      sources: [
        {
          name: "Demo Haber Merkezi",
          url: "https://example.com/demo/iklim-zirvesi",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-19T07:40:00+03:00",
      status: "published",
      tags: ["iklim", "enerji", "sürdürülebilirlik"],
      isBreaking: true,
      views: 7410,
      author: "Demo Haber Merkezi"
    },
    {
      id: "demo-world-003",
      title: "Küresel limanlarda yük trafiği üçüncü çeyrekte arttı",
      slug: "kuresel-limanlarda-yuk-trafigi-artti",
      category: "world",
      summary:
        "Açıklanan örnek verilere göre konteyner elleçleme hacmi önceki çeyreğe kıyasla yükseldi; tedarik zinciri uzmanları yıl sonu için temkinli.",
      content: [
        {
          type: "p",
          text:
            "Küresel liman işletmelerinin paylaştığı örnek verilere göre yılın üçüncü çeyreğinde konteyner elleçleme hacmi bir önceki çeyreğe göre artış gösterdi. Artışta Asya-Avrupa hattındaki sefer sayılarındaki toparlanma ve stok yenileme talebi etkili oldu."
        },
        {
          type: "p",
          text:
            "Uzmanlar, trafik artışının navlun fiyatlarına etkisinin sınırlı kaldığını, yeni gemi kapasitesinin devreye girmesiyle dengenin korunduğunu belirtiyor. Limanlarda bekleme süreleri ise bölgeye göre büyük farklılık gösteriyor."
        },
        { type: "h2", text: "Demiryolu bağlantıları öne çıkıyor" },
        {
          type: "p",
          text:
            "İşletmeler, liman çıkışlarında karayolu yerine demiryolu bağlantılarını daha fazla kullanıyor. Bu tercih, aktarma merkezlerindeki yığılmayı azaltırken toplam taşıma süresini kısaltıyor."
        },
        {
          type: "p",
          text:
            "Sektör temsilcileri, yıl sonu döneminde talep dalgalanmalarına karşı esnek çalışma planlarını sürdüreceklerini ifade ediyor. Önümüzdeki çeyrekte kapasite artışının sürmesi bekleniyor."
        },
        {
          type: "p",
          text:
            "Bu içerik, örnek rakamlarla hazırlanmış DEMO bir haber metnidir; herhangi bir liman işletmesinin açıklamasına dayanmaz."
        }
      ],
      image: "assets/images/world-port.jpg",
      imageAlt: "Alacakaranlıkta vinçler ve konteyner yığınlarıyla liman",
      sourceName: "Demo Ekonomi Masası",
      sourceUrl: "https://example.com/demo/liman-trafigi",
      sources: [
        {
          name: "Demo Ekonomi Masası",
          url: "https://example.com/demo/liman-trafigi",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-18T15:20:00+03:00",
      status: "published",
      tags: ["ticaret", "lojistik", "ekonomi"],
      isBreaking: false,
      views: 5120,
      author: "Demo Ekonomi Masası"
    },
    {
      id: "demo-world-004",
      title: "Uluslararası kuruluş gıda fiyatlarındaki dalgalanmaya dikkat çekti",
      slug: "gida-fiyatlarinda-dalgalanma-uyarisi",
      category: "world",
      summary:
        "Aylık örnek raporda tahıl ve bitkisel yağ fiyatlarının seyri değerlendirildi; iklim koşullarının arz üzerindeki etkisi vurgulandı.",
      content: [
        {
          type: "p",
          text:
            "Uluslararası bir kuruluşun yayımladığı örnek raporda, küresel gıda fiyat endeksinin aylık bazda sınırlı bir değişim gösterdiği belirtildi. Tahıl grubunda arz koşullarına bağlı dalgalanma öne çıkarken, bitkisel yağ fiyatları yatay seyretti."
        },
        {
          type: "p",
          text:
            "Rapor, hava koşullarının üretim bölgelerindeki etkisinin izlenmesi gerektiğini vurguluyor. Depolama kapasitesi ve lojistik maliyetleri de fiyat oluşumunda belirleyici başlıklar arasında sayıldı."
        },
        { type: "h2", text: "Kısa vadeli görünüm" },
        {
          type: "p",
          text:
            "Örnek analizde, kısa vadede fiyatların mevsimsel etkenlerle dalgalanmaya devam edebileceği, ancak küresel stok seviyelerinin dengeli olduğu ifade edildi. Üretici ülkelerde sulama yatırımlarının önemi ayrıca vurgulandı."
        },
        {
          type: "p",
          text:
            "Bu metin ve içindeki tüm değerlendirmeler DEMO amaçlıdır; gerçek bir kuruluş raporuna veya piyasa verisine dayanmaz."
        }
      ],
      image: "assets/images/world-trade.svg",
      imageAlt: "Dünya ticareti temasını işleyen soyut grafik kapak",
      sourceName: "Demo Ekonomi Masası",
      sourceUrl: "https://example.com/demo/gida-fiyatlari",
      sources: [
        {
          name: "Demo Ekonomi Masası",
          url: "https://example.com/demo/gida-fiyatlari",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-17T11:45:00+03:00",
      status: "published",
      tags: ["gıda", "ekonomi", "tarım"],
      isBreaking: false,
      views: 3260,
      author: "Demo Ekonomi Masası"
    },

    {
      id: "demo-turkey-001",
      title: "Büyükşehirlerde yeni ulaşım planı: metro hatlarında kapasite artışı",
      slug: "buyuksehirlerde-yeni-ulasim-plani",
      category: "turkey",
      summary:
        "Örnek plana göre yoğun saatlerde sefer sıklığı artırılacak, aktarma merkezlerinde yeni düzenlemeler yapılacak. Çalışmaların etaplar hâlinde ilerlemesi öngörülüyor.",
      content: [
        {
          type: "p",
          text:
            "Büyükşehirlerde toplu taşıma kapasitesini artırmayı hedefleyen örnek ulaşım planı kamuoyuyla paylaşıldı. Plana göre yoğun saatlerde metro sefer sıklığı artırılacak, aktarma merkezlerinde yönlendirme ve bekleme alanları yeniden düzenlenecek."
        },
        {
          type: "p",
          text:
            "Planın ilk etabında hat kapasitesi ve sinyalizasyon altyapısı ele alınacak. İkinci etapta ise istasyon girişlerinde erişilebilirlik iyileştirmeleri ve bisiklet park alanları devreye alınacak."
        },
        { type: "h2", text: "Yoğun saatlerde hedef: daha kısa bekleme" },
        {
          type: "p",
          text:
            "Uzmanlar, kapasite artışının yalnızca araç sayısıyla değil, aktarma noktalarındaki akış düzeniyle birlikte ele alınması gerektiğini belirtiyor. Örnek planda bu konuda ayrı bir çalışma başlığı bulunuyor."
        },
        {
          type: "p",
          text:
            "Yolculuk sürelerinin ölçülmesi için istasyonlarda örnek ölçüm noktaları oluşturulacağı, sonuçların düzenli olarak paylaşılacağı ifade edildi."
        },
        {
          type: "p",
          text:
            "Bu haber, portalın ulaşım temalı kart ve detay görünümünü test etmek için hazırlanmış DEMO bir metindir; gerçek bir kurum açıklamasına dayanmaz."
        }
      ],
      image: "assets/images/turkey-train.svg",
      imageAlt: "Modern istasyonda bekleyen yüksek hızlı tren illüstrasyonu",
      sourceName: "Demo Şehir Masası",
      sourceUrl: "https://example.com/demo/ulasim-plani",
      sources: [
        {
          name: "Demo Şehir Masası",
          url: "https://example.com/demo/ulasim-plani",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-19T09:10:00+03:00",
      status: "published",
      tags: ["ulaşım", "şehir", "metro"],
      isBreaking: true,
      views: 12480,
      author: "Demo Şehir Masası"
    },
    {
      id: "demo-turkey-002",
      title: "Üniversitelerde dijital ders materyalleri yaygınlaşıyor",
      slug: "universitelerde-dijital-ders-materyalleri",
      category: "turkey",
      summary:
        "Örnek araştırmaya göre öğrencilerin büyük bölümü ders materyallerine çevrim içi erişimi faydalı buluyor; erişilebilirlik ve arşivleme öne çıkan başlıklar.",
      content: [
        {
          type: "p",
          text:
            "Üniversitelerde dijital ders materyallerinin kullanımı artıyor. Örnek araştırmaya katılan öğrencilerin büyük bölümü, ders notlarına ve kaynaklara çevrim içi erişimin çalışma düzenini kolaylaştırdığını belirtiyor."
        },
        {
          type: "p",
          text: "Araştırmada öne çıkan başlıklar arasında materyallerin erişilebilirliği, arşivlenmesi ve farklı cihazlarda tutarlı görüntülenmesi yer alıyor. Öğretim üyeleri ise içerik güncellemenin kolaylaşmasını olumlu buluyor."
        },
        { type: "h2", text: "Karma model tercih ediliyor" },
        {
          type: "p",
          text:
            "Katılımcıların önemli bir kısmı, dijital materyallerin basılı kaynaklarla birlikte kullanıldığı karma modeli tercih ediyor. Örnek verilere göre dijital içerik, ders öncesi hazırlık aşamasında daha sık kullanılıyor."
        },
        {
          type: "p",
          text:
            "Uzmanlar, dijital materyallerin kapsayıcı tasarım ilkeleriyle hazırlanmasının ve uzun vadeli arşivleme politikasının önemine dikkat çekiyor."
        },
        {
          type: "p",
          text:
            "Bu içerik DEMO amaçlı hazırlanmıştır; gerçek bir araştırmanın sonuçlarını aktarmaz."
        }
      ],
      image: "assets/images/turkey-campus.svg",
      imageAlt: "Kampüs bahçesinde yürüyen öğrencileri gösteren illüstrasyon",
      sourceName: "Demo Eğitim Masası",
      sourceUrl: "https://example.com/demo/dijital-ders-materyalleri",
      sources: [
        {
          name: "Demo Eğitim Masası",
          url: "https://example.com/demo/dijital-ders-materyalleri",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-18T13:30:00+03:00",
      status: "published",
      tags: ["eğitim", "üniversite", "dijitalleşme"],
      isBreaking: false,
      views: 6870,
      author: "Demo Eğitim Masası"
    },
    {
      id: "demo-turkey-003",
      title: "Şehir merkezlerinde kentsel dönüşümde yeni etap başlıyor",
      slug: "kentsel-donusumde-yeni-etap",
      category: "turkey",
      summary:
        "Örnek programa göre riskli yapıların bulunduğu mahallelerde zemin etütleri tamamlandı; süreç, hak sahipleriyle yapılan görüşmelerle ilerleyecek.",
      content: [
        {
          type: "p",
          text:
            "Şehir merkezlerinde yürütülen kentsel dönüşüm çalışmalarında yeni etap için hazırlıklar tamamlandı. Örnek programa göre riskli yapıların yoğun olduğu mahallelerde zemin etütleri ve teknik incelemeler sonuçlandı."
        },
        {
          type: "p",
          text:
            "Süreçte hak sahipleriyle bireysel görüşmeler yapılacak, uygulama takvimi mahalle bazında açıklanacak. Yeni yapılarda enerji verimliliği ve ortak alan düzenlemeleri öncelikli başlıklar arasında."
        },
        { type: "h2", text: "Sosyal altyapı da plana dahil" },
        {
          type: "p",
          text:
            "Örnek planda yalnızca konut değil, okul ve sağlık tesisi gibi sosyal altyapı ihtiyaçları da değerlendiriliyor. Ulaşım bağlantılarının yeni nüfus yoğunluğuna göre güncellenmesi öngörülüyor."
        },
        {
          type: "p",
          text:
            "Uzmanlar, dönüşüm süreçlerinde şeffaf bilgilendirme ve itiraz mekanizmalarının işlerliğinin güven açısından belirleyici olduğunu vurguluyor."
        },
        {
          type: "p",
          text:
            "Bu haber DEMO amaçlıdır; gerçek bir kentsel dönüşüm programını veya kurum açıklamasını temsil etmez."
        }
      ],
      image: "assets/images/turkey-city.jpg",
      imageAlt: "Altın saatte modern şehir silüeti ve geniş bulvar",
      sourceName: "Demo Şehir Masası",
      sourceUrl: "https://example.com/demo/kentsel-donusum",
      sources: [
        {
          name: "Demo Şehir Masası",
          url: "https://example.com/demo/kentsel-donusum",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-17T16:10:00+03:00",
      status: "published",
      tags: ["şehir", "kentsel dönüşüm", "konut"],
      isBreaking: false,
      views: 4580,
      author: "Demo Şehir Masası"
    },
    {
      id: "demo-turkey-004",
      title: "Yerli üretim destek programına başvurular açıldı",
      slug: "yerli-uretim-destek-programi-basvurulari",
      category: "turkey",
      summary:
        "Orta ölçekli işletmelere yönelik örnek program kapsamında üretim hattı modernizasyonu ve nitelikli istihdam başlıkları desteklenecek.",
      content: [
        {
          type: "p",
          text:
            "Orta ölçekli işletmelerin üretim kapasitesini geliştirmeyi amaçlayan örnek destek programı için başvurular başladı. Program kapsamında üretim hattı modernizasyonu, enerji verimliliği ve nitelikli istihdam başlıkları desteklenecek."
        },
        {
          type: "p",
          text:
            "Başvuruların değerlendirilmesinde teknoloji yoğunluğu, yerli tedarik oranı ve ihracat potansiyeli ölçütleri kullanılacak. Örnek takvime göre sonuçlar iki aşamalı olarak açıklanacak."
        },
        { type: "h2", text: "KOBİ'ler için ayrı bilgilendirme" },
        {
          type: "p",
          text:
            "Küçük işletmelerin sürece erişimini kolaylaştırmak için çevrim içi bilgilendirme oturumları düzenlenecek. Başvuru sürecinde teknik danışmanlık desteği de sağlanacak."
        },
        {
          type: "p",
          text:
            "Sektör temsilcileri, desteklerin uzun vadeli planlamayla birleştirilmesinin üretim yatırımlarında öngörülebilirliği artıracağını belirtiyor."
        },
        {
          type: "p",
          text:
            "Bu yazı DEMO amaçlı hazırlanmış örnek bir haberdir; gerçek bir destek programına veya başvuru takvimine dayanmaz."
        }
      ],
      image: "assets/images/turkey-industry.svg",
      imageAlt: "Fabrika üretim hattı ve dişli çarkları gösteren illüstrasyon",
      sourceName: "Demo Ekonomi Masası",
      sourceUrl: "https://example.com/demo/yerli-uretim",
      sources: [
        {
          name: "Demo Ekonomi Masası",
          url: "https://example.com/demo/yerli-uretim",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-16T09:50:00+03:00",
      status: "published",
      tags: ["üretim", "destek", "ekonomi"],
      isBreaking: false,
      views: 3910,
      author: "Demo Ekonomi Masası"
    },

    {
      id: "demo-tech-001",
      title: "Yapay zekâ modellerinde enerji verimliliği öne çıkıyor",
      slug: "yapay-zeka-modellerinde-enerji-verimliligi",
      category: "technology",
      summary:
        "Yeni nesil modellerin eğitim ve çalıştırma maliyetleri tartışılırken, veri merkezlerinde verimlilik ölçümleri standartlaşmaya başlıyor.",
      content: [
        {
          type: "p",
          text:
            "Yapay zekâ modellerinin enerji tüketimi, teknoloji gündeminin öne çıkan başlıklarından biri hâline geldi. Örnek sektör raporlarına göre veri merkezlerinde soğutma ve güç dağıtımı, toplam tüketimin önemli bir bölümünü oluşturuyor."
        },
        {
          type: "p",
          text:
            "Model geliştiricileri, daha küçük ve özelleşmiş modellerle aynı görevlerde benzer sonuçları daha düşük maliyetle elde etmeye odaklanıyor. Bu yaklaşım, özellikle cihaz üzerinde çalışan uygulamalarda yaygınlaşıyor."
        },
        { type: "h2", text: "Verimlilik nasıl ölçülecek?" },
        {
          type: "p",
          text:
            "Sektör temsilcileri, bir modelin yalnızca doğruluk oranıyla değil, görev başına enerji tüketimiyle de değerlendirilmesi gerektiğini belirtiyor. Ortak ölçüm yöntemleri üzerinde çalışmalar sürüyor."
        },
        {
          type: "p",
          text:
            "Uzmanlar, verimlilik artışının donanım, yazılım ve veri merkezi tasarımının birlikte ele alınmasıyla mümkün olduğunu vurguluyor."
        },
        {
          type: "p",
          text:
            "Bu içerik DEMO amaçlıdır; gerçek bir rapora veya şirket açıklamasına dayanmaz."
        }
      ],
      image: "assets/images/tech-ai.svg",
      imageAlt: "Mavi ışıklarla aydınlatılmış veri merkezi illüstrasyonu",
      sourceName: "Demo Teknoloji Masası",
      sourceUrl: "https://example.com/demo/yapay-zeka-enerji",
      sources: [
        {
          name: "Demo Teknoloji Masası",
          url: "https://example.com/demo/yapay-zeka-enerji",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-19T08:05:00+03:00",
      status: "published",
      tags: ["yapay zekâ", "enerji", "veri merkezi"],
      isBreaking: false,
      views: 11430,
      author: "Demo Teknoloji Masası"
    },
    {
      id: "demo-tech-002",
      title: "Yeni nesil gözlemevi ilk görüntülerini paylaştı",
      slug: "yeni-nesil-gozlemevi-ilk-goruntuleri",
      category: "technology",
      summary:
        "Örnek projede kullanılan geniş alan sensörleri, soluk gök cisimlerinin izlenmesini kolaylaştırmayı hedefliyor. Veriler araştırma ekipleriyle paylaşılacak.",
      content: [
        {
          type: "p",
          text:
            "Yeni nesil bir gözlemevinin ilk test görüntüleri yayımlandı. Örnek proje kapsamında geliştirilen geniş alan sensörleri, soluk gök cisimlerinin kısa sürede taranmasını amaçlıyor."
        },
        {
          type: "p",
          text:
            "Ekip, test görüntülerinde görüntü kalitesi ve takip hassasiyeti açısından beklenen sonuçlara ulaşıldığını belirtiyor. Gözlemevinin düzenli gözlem programına gelecek yıl başlaması planlanıyor."
        },
        { type: "h2", text: "Veriler açık erişimle paylaşılacak" },
        {
          type: "p",
          text:
            "Projede elde edilen verilerin bir bölümünün araştırma kurumlarıyla açık erişimle paylaşılması öngörülüyor. Bu yaklaşımın, geçici parlaklık değişimlerinin incelenmesine katkı sağlaması bekleniyor."
        },
        {
          type: "p",
          text:
            "Uzmanlar, gözlem süresinin artmasıyla birlikte veri işleme kapasitesinin de önemli bir başlık hâline geleceğini ifade ediyor."
        },
        {
          type: "p",
          text:
            "Bu haber DEMO amaçlıdır; gerçek bir gözlemevi projesini veya bilimsel sonucu temsil etmez."
        }
      ],
      image: "assets/images/tech-space.svg",
      imageAlt: "Gece gökyüzünde teleskop ve yıldızları gösteren illüstrasyon",
      sourceName: "Demo Bilim Masası",
      sourceUrl: "https://example.com/demo/gozlemevi",
      sources: [
        {
          name: "Demo Bilim Masası",
          url: "https://example.com/demo/gozlemevi",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-18T18:25:00+03:00",
      status: "published",
      tags: ["uzay", "bilim", "gözlemevi"],
      isBreaking: false,
      views: 8360,
      author: "Demo Bilim Masası"
    },
    {
      id: "demo-tech-003",
      title: "Siber güvenlikte kimlik doğrulama yöntemleri değişiyor",
      slug: "siber-guvenlikte-kimlik-dogrulama",
      category: "technology",
      summary:
        "Parola yerine cihaz tabanlı ve çok adımlı doğrulama yöntemleri yaygınlaşıyor. Uzmanlar, kullanıcı deneyimi ile güvenlik arasındaki dengeye dikkat çekiyor.",
      content: [
        {
          type: "p",
          text:
            "Siber güvenlik alanında kimlik doğrulama yöntemleri hızla değişiyor. Örnek sektör değerlendirmelerine göre kurumlar, parola yerine cihaz tabanlı ve çok adımlı doğrulama yaklaşımlarına yöneliyor."
        },
        {
          type: "p",
          text:
            "Bu geçişte en büyük zorluk, güvenlik artışını kullanıcı deneyimini bozmadan sağlamak. Uzmanlar, doğrulama adımlarının işlem riskine göre uyarlanmasını öneriyor."
        },
        { type: "h2", text: "Oltalama saldırılarına karşı farkındalık" },
        {
          type: "p",
          text:
            "Teknik önlemlerin yanında çalışan farkındalığının sürdürülmesi gerektiği vurgulanıyor. Örnek değerlendirmede, düzenli tatbikatların saldırı tespit süresini kısalttığı belirtiliyor."
        },
        {
          type: "p",
          text:
            "Kurumların envanter takibi ve yama yönetimi süreçlerini otomatikleştirmesi, saldırı yüzeyini azaltmada temel adımlar arasında sayılıyor."
        },
        {
          type: "p",
          text:
            "Bu içerik DEMO amaçlı hazırlanmıştır; gerçek bir güvenlik raporuna dayanmaz."
        }
      ],
      image: "assets/images/tech-cyber.svg",
      imageAlt: "Kalkan ve kod satırlarıyla siber güvenlik illüstrasyonu",
      sourceName: "Demo Teknoloji Masası",
      sourceUrl: "https://example.com/demo/siber-guvenlik",
      sources: [
        {
          name: "Demo Teknoloji Masası",
          url: "https://example.com/demo/siber-guvenlik",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-17T10:40:00+03:00",
      status: "published",
      tags: ["siber güvenlik", "kimlik doğrulama", "teknoloji"],
      isBreaking: false,
      views: 6040,
      author: "Demo Teknoloji Masası"
    },
    {
      id: "demo-tech-004",
      title: "Fabrikalarda robotik otomasyon yatırımları hızlandı",
      slug: "fabrikalarda-robotik-otomasyon-yatirimlari",
      category: "technology",
      summary:
        "Örnek verilere göre orta ölçekli üretim tesisleri, tekrarlayan görevler için iş birliğine açık robotlara yöneliyor. Çalışan eğitimi kritik başlık.",
      content: [
        {
          type: "p",
          text:
            "Üretim tesislerinde robotik otomasyon yatırımları artıyor. Örnek verilere göre orta ölçekli işletmeler, özellikle tekrarlayan ve ergonomik risk taşıyan görevler için iş birliğine açık robotları tercih ediyor."
        },
        {
          type: "p",
          text:
            "Yatırımların planlanmasında toplam sahip olma maliyeti, bakım kapasitesi ve mevcut hatlarla entegrasyon öne çıkıyor. İşletmeler, küçük ölçekli pilot uygulamalarla başlamayı tercih ediyor."
        },
        { type: "h2", text: "Çalışan eğitimi belirleyici" },
        {
          type: "p",
          text:
            "Otomasyonun verimlilik etkisi, çalışanların yeni sistemlere uyum sağlamasıyla doğrudan ilişkili. Örnek değerlendirmede, eğitim programlarına yatırım yapan tesislerde devreye alma süresinin kısaldığı belirtiliyor."
        },
        {
          type: "p",
          text:
            "Uzmanlar, otomasyonun istihdamı tamamen ortadan kaldırmak yerine görev tanımlarını dönüştürdüğünü, bu nedenle beceri planlamasının önemli olduğunu vurguluyor."
        },
        {
          type: "p",
          text:
            "Bu haber DEMO amaçlıdır; gerçek bir sektör araştırmasını temsil etmez."
        }
      ],
      image: "assets/images/tech-robot.svg",
      imageAlt: "Üretim hattında çalışan robot kolu illüstrasyonu",
      sourceName: "Demo Sanayi Masası",
      sourceUrl: "https://example.com/demo/robotik-otomasyon",
      sources: [
        {
          name: "Demo Sanayi Masası",
          url: "https://example.com/demo/robotik-otomasyon",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-15T14:05:00+03:00",
      status: "published",
      tags: ["otomasyon", "robotik", "sanayi"],
      isBreaking: false,
      views: 5230,
      author: "Demo Sanayi Masası"
    },
    {
      id: "demo-world-005",
      title: "Sınır ötesi su iş birliği için teknik komite kuruldu",
      slug: "sinir-otesi-su-is-birligi-komitesi",
      category: "world",
      summary:
        "Örnek anlaşmaya göre komite, ortak su havzalarında ölçüm standartlarını uyumlu hâle getirecek ve yıllık rapor yayımlayacak.",
      content: [
        {
          type: "p",
          text:
            "Ortak su havzalarının yönetimi için teknik bir komite kurulduğu açıklandı. Örnek anlaşmaya göre komite, ölçüm istasyonlarının standartlarını uyumlu hâle getirmek ve verileri düzenli olarak paylaşmakla görevli olacak."
        },
        {
          type: "p",
          text:
            "Komitenin ilk toplantısını gelecek ay yapması bekleniyor. Gündemde yağış ölçümleri, yer altı su seviyeleri ve tarımsal kullanım verilerinin ortak formatta toplanması yer alıyor."
        },
        { type: "h2", text: "Yıllık rapor kamuya açık olacak" },
        {
          type: "p",
          text:
            "Anlaşma metnine göre komite, her yıl hazırlayacağı değerlendirme raporunu kamuya açık şekilde yayımlayacak. Böylece havza genelinde şeffaflığın artırılması hedefleniyor."
        },
        {
          type: "p",
          text:
            "Bu haber DEMO amaçlı hazırlanmıştır; gerçek bir anlaşmayı veya komiteyi temsil etmez."
        }
      ],
      image: "assets/images/world-climate.svg",
      imageAlt: "Su ve iklim iş birliğini simgeleyen illüstrasyon",
      sourceName: "Demo Dış Haberler Masası",
      sourceUrl: "https://example.com/demo/su-is-birligi",
      sources: [
        {
          name: "Demo Dış Haberler Masası",
          url: "https://example.com/demo/su-is-birligi",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-16T14:25:00+03:00",
      status: "published",
      tags: ["su", "iklim", "diplomasi"],
      isBreaking: false,
      views: 2740,
      author: "Demo Dış Haberler Masası"
    },
    {
      id: "demo-world-006",
      title: "Küresel turizmde yıl sonu beklentileri yukarı yönlü",
      slug: "kuresel-turizmde-yil-sonu-beklentileri",
      category: "world",
      summary:
        "Örnek sektör anketine göre rezervasyonlarda son çeyrekte toparlanma görülüyor; uzun konaklamalar ve şehir turizmi öne çıkıyor.",
      content: [
        {
          type: "p",
          text:
            "Küresel turizm sektöründe yıl sonu beklentileri iyileşiyor. Örnek sektör anketine katılan işletmelerin çoğunluğu, son çeyrekte rezervasyonlarda toparlanma gözlemlediğini belirtiyor."
        },
        {
          type: "p",
          text:
            "Ankete göre uzun konaklamalar ve şehir turizmi öne çıkıyor. Ulaşım maliyetleri ile konaklama fiyatları ise seyahat kararlarında belirleyici olmayı sürdürüyor."
        },
        { type: "h2", text: "Sürdürülebilir turizm vurgusu" },
        {
          type: "p",
          text:
            "İşletmeler, enerji ve su tasarrufu uygulamalarının misafir tercihlerinde giderek daha fazla dikkate alındığını ifade ediyor. Bölgesel mutfak ve yerel rehberlik hizmetleri de öne çıkan başlıklar arasında."
        },
        {
          type: "p",
          text:
            "Bu metin DEMO amaçlıdır; herhangi bir anket veya sektör verisine dayanmaz."
        }
      ],
      image: "assets/images/world-trade.svg",
      imageAlt: "Küresel turizm ve ulaşım temasını işleyen illüstrasyon",
      sourceName: "Demo Ekonomi Masası",
      sourceUrl: "https://example.com/demo/turizm-beklentileri",
      sources: [
        {
          name: "Demo Ekonomi Masası",
          url: "https://example.com/demo/turizm-beklentileri",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-14T12:15:00+03:00",
      status: "published",
      tags: ["turizm", "ekonomi", "seyahat"],
      isBreaking: false,
      views: 2140,
      author: "Demo Ekonomi Masası"
    },
    {
      id: "demo-turkey-005",
      title: "Kırsal kalkınma projelerinde yeni dönem başlıyor",
      slug: "kirsal-kalkinma-projelerinde-yeni-donem",
      category: "turkey",
      summary:
        "Örnek programa göre tarımsal üretim, yerel işleme tesisleri ve kooperatifler birlikte değerlendirilecek; ilk etapta pilot iller belirlendi.",
      content: [
        {
          type: "p",
          text:
            "Kırsal kalkınma projelerinde yeni bir dönem başlıyor. Örnek programa göre tarımsal üretim, yerel işleme tesisleri ve kooperatifler tek bir plan çerçevesinde değerlendirilecek."
        },
        {
          type: "p",
          text:
            "İlk etapta belirlenen pilot illerde üretim deseni, sulama altyapısı ve lojistik ihtiyaçları birlikte ele alınacak. Projelerin yerel istihdamı desteklemesi hedefleniyor."
        },
        { type: "h2", text: "Kooperatiflere teknik destek" },
        {
          type: "p",
          text:
            "Program kapsamında kooperatiflere yönelik eğitim ve teknik danışmanlık desteği sağlanacak. Ürünlerin pazara erişiminde aracı sayısının azaltılması da hedefler arasında yer alıyor."
        },
        {
          type: "p",
          text:
            "Bu haber DEMO amaçlıdır; gerçek bir kalkınma programını temsil etmez."
        }
      ],
      image: "assets/images/turkey-industry.svg",
      imageAlt: "Kırsal üretim ve tarım temasını işleyen illüstrasyon",
      sourceName: "Demo Ekonomi Masası",
      sourceUrl: "https://example.com/demo/kirsal-kalkinma",
      sources: [
        {
          name: "Demo Ekonomi Masası",
          url: "https://example.com/demo/kirsal-kalkinma",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-15T10:35:00+03:00",
      status: "published",
      tags: ["tarım", "kalkınma", "üretim"],
      isBreaking: false,
      views: 3120,
      author: "Demo Ekonomi Masası"
    },
    {
      id: "demo-turkey-006",
      title: "Şehir hastanelerinde dijital randevu sistemi genişliyor",
      slug: "sehir-hastanelerinde-dijital-randevu",
      category: "turkey",
      summary:
        "Örnek uygulamaya göre poliklinik randevuları tek ekran üzerinden yönetilebilecek; yaşlı hastalar için telefonla destek hattı korunacak.",
      content: [
        {
          type: "p",
          text:
            "Şehir hastanelerinde dijital randevu sisteminin kapsamı genişliyor. Örnek uygulamaya göre hastalar, poliklinik randevularını ve tetkik sonuçlarını tek bir ekran üzerinden takip edebilecek."
        },
        {
          type: "p",
          text:
            "Sistemin randevuya gelmeme oranını azaltması ve polikliniklerdeki yığılmayı hafifletmesi bekleniyor. Dijital erişimde zorlanan hastalar için telefonla destek hattı korunacak."
        },
        { type: "h2", text: "Veri güvenliği ön planda" },
        {
          type: "p",
          text:
            "Uygulama kapsamında hasta verilerinin yalnızca yetkili personel tarafından görüntülenebilmesi için ek erişim kontrolleri tanımlandı. Kullanıcı hesaplarında iki adımlı doğrulama uygulanacak."
        },
        {
          type: "p",
          text:
            "Bu haber DEMO amaçlıdır; gerçek bir sağlık uygulamasını temsil etmez."
        }
      ],
      image: "assets/images/turkey-city.jpg",
      imageAlt: "Şehir hastanesi uygulamasını simgeleyen şehir görseli",
      sourceName: "Demo Sağlık Masası",
      sourceUrl: "https://example.com/demo/dijital-randevu",
      sources: [
        {
          name: "Demo Sağlık Masası",
          url: "https://example.com/demo/dijital-randevu",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-14T08:45:00+03:00",
      status: "published",
      tags: ["sağlık", "dijitalleşme", "şehir"],
      isBreaking: false,
      views: 4390,
      author: "Demo Sağlık Masası"
    },
    {
      id: "demo-tech-005",
      title: "Açık kaynak yazılımlarda güvenlik güncellemeleri hızlandı",
      slug: "acik-kaynak-yazilimlarda-guvenlik-guncellemeleri",
      category: "technology",
      summary:
        "Örnek değerlendirmeye göre bakım ekipleri, kritik açıkları daha kısa sürede yamalıyor; kurumların güncelleme takvimlerini gözden geçirmesi öneriliyor.",
      content: [
        {
          type: "p",
          text:
            "Açık kaynak yazılım projelerinde güvenlik güncellemelerinin yayınlanma hızı arttı. Örnek değerlendirmeye göre bakım ekipleri, kritik olarak sınıflandırılan açıkları daha kısa sürede yamalıyor."
        },
        {
          type: "p",
          text:
            "Uzmanlar, yama hızının tek başına yeterli olmadığını; kurumların güncellemeleri test ortamlarında doğrulayıp planlı şekilde devreye alması gerektiğini belirtiyor."
        },
        { type: "h2", text: "Yazılım envanteri önerisi" },
        {
          type: "p",
          text:
            "Kurumlara, kullandıkları açık kaynak bileşenlerin envanterini tutmaları ve sürüm takibini otomatikleştirmeleri öneriliyor. Böylece etkilenen sistemlerin belirlenmesi kolaylaşıyor."
        },
        {
          type: "p",
          text:
            "Bu içerik DEMO amaçlıdır; gerçek bir güvenlik değerlendirmesine dayanmaz."
        }
      ],
      image: "assets/images/tech-cyber.svg",
      imageAlt: "Açık kaynak güvenlik güncellemelerini simgeleyen illüstrasyon",
      sourceName: "Demo Teknoloji Masası",
      sourceUrl: "https://example.com/demo/acik-kaynak-guvenlik",
      sources: [
        {
          name: "Demo Teknoloji Masası",
          url: "https://example.com/demo/acik-kaynak-guvenlik",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-16T16:30:00+03:00",
      status: "published",
      tags: ["açık kaynak", "siber güvenlik", "yazılım"],
      isBreaking: false,
      views: 4710,
      author: "Demo Teknoloji Masası"
    },
    {
      id: "demo-tech-006",
      title: "Uydu tabanlı internet erişiminde kapsama alanı genişliyor",
      slug: "uydu-tabanli-internette-kapsama-alani",
      category: "technology",
      summary:
        "Örnek projeye göre yeni uydu takımları, kırsal bölgelerde yedek bağlantı kapasitesi sunacak. Gecikme süreleri ve veri paketleri test ediliyor.",
      content: [
        {
          type: "p",
          text:
            "Uydu tabanlı internet erişiminde kapsama alanı genişliyor. Örnek projeye göre yeni uydu takımları, kırsal bölgelerde yedek bağlantı kapasitesi sunacak."
        },
        {
          type: "p",
          text:
            "Test aşamasında gecikme süreleri ve veri paketlerinin kararlılığı ölçülüyor. Ekipler, özellikle olumsuz hava koşullarında bağlantı sürekliliğine odaklanıyor."
        },
        { type: "h2", text: "Afet senaryolarında kullanım" },
        {
          type: "p",
          text:
            "Uydu bağlantılarının, altyapı kesintilerinde acil iletişim için alternatif bir kanal olarak kullanılması planlanıyor. Bu kapsamda taşınabilir terminallerin saha testleri sürüyor."
        },
        {
          type: "p",
          text:
            "Bu haber DEMO amaçlıdır; gerçek bir uydu projesini temsil etmez."
        }
      ],
      image: "assets/images/tech-space.svg",
      imageAlt: "Uydu tabanlı internet erişimini simgeleyen uzay illüstrasyonu",
      sourceName: "Demo Teknoloji Masası",
      sourceUrl: "https://example.com/demo/uydu-internet",
      sources: [
        {
          name: "Demo Teknoloji Masası",
          url: "https://example.com/demo/uydu-internet",
          note: "Örnek içerik kaynağı"
        }
      ],
      publishedAt: "2026-11-14T19:10:00+03:00",
      status: "published",
      tags: ["uydu", "internet", "iletişim"],
      isBreaking: false,
      views: 5580,
      author: "Demo Teknoloji Masası"
    }
  ];
})();
