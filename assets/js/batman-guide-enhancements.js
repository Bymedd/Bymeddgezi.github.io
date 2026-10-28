(function () {
    'use strict';

    function findCard(title) {
        const card = Array.from(document.querySelectorAll('section.cat .card'))
            .find(item => item.querySelector('h3')?.textContent.trim() === title);

        if (!card) throw new Error(`Batman rehber kartı bulunamadı: ${title}`);
        return card;
    }

    function linkCard(title, id) {
        const card = findCard(title);
        card.id = id;
        card.setAttribute('tabindex', '-1');
        return card;
    }

    function addSourceLink(card, label, url) {
        const link = document.createElement('a');
        link.className = 'source-link';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        card.querySelector('.cbody p').after(link);
    }

    const hasankeyf = findCard('Hasankeyf ve yeni kültür parkı');
    linkCard('Hasankeyf ve yeni kültür parkı', 'batman-hasankeyf');
    hasankeyf.querySelector('.tag.dist').textContent = 'Hasankeyf';
    hasankeyf.querySelector('.cbody p').textContent = "Hasankeyf ilçesindeki yeni ziyaret alanı, taşınan anıt yapılarıyla tarih rotasının başlangıç noktasıdır. Eski yerleşimde su altında kalan alanları günümüzde ziyaret edilebilen yerlerle karıştırmayın.";

    const zeynel = findCard('Zeynel Bey Türbesi');
    linkCard('Zeynel Bey Türbesi', 'batman-zeynel-bey');
    zeynel.querySelector('.cbody p').textContent = "Dicle kıyısındaki eski konumundan Hasankeyf Yeni Kültürel Park Alanı'na taşınan Akkoyunlu türbesidir. Haritada güncel ziyaret alanını seçin; eski yerleşimdeki konumuyla karıştırmayın.";
    zeynel.querySelector('.map').href = 'https://www.google.com/maps/search/?api=1&query=Zeynel+Bey+T%C3%BCrbesi+Hasankeyf+Yeni+K%C3%BClt%C3%BCrel+Park+Alan%C4%B1';
    addSourceLink(zeynel, 'Taşınma ve tarihçe bilgisi ↗', 'https://tr.wikipedia.org/wiki/Zeynel_Bey_T%C3%BCrbesi');

    const malabadi = findCard('Malabadi Köprüsü');
    malabadi.querySelector('.tag.dist').textContent = 'Diyarbakır · Silvan';
    malabadi.querySelector('.cbody p').textContent = "Malabadi Köprüsü Batman il sınırları dışında, Diyarbakır'ın Silvan ilçesi yakınındadır. Batman'dan günübirlik gezi planlarken idari konumunu ve yol koşullarını dikkate alın.";
    malabadi.dataset.search = 'malabadi köprüsü diyarbakır silvan yakın çevre tarihi köprü';
    malabadi.querySelector('.map').href = 'https://www.google.com/maps/search/?api=1&query=Malabadi+K%C3%B6pr%C3%BCs%C3%BC+Silvan+Diyarbak%C4%B1r';

    const museum = findCard('Batman kent kültürü durakları');
    linkCard('Batman kent kültürü durakları', 'batman-muzesi');
    museum.querySelector('h3').textContent = 'Batman Müzesi';
    museum.dataset.search = 'batman müzesi arkeoloji müze kent kültürü';
    museum.querySelector('.cbody p').textContent = "Batman Müzesi'nde, Ilısu Barajı nedeniyle etkilenen alanlardaki kurtarma kazılarından çıkarılan eserler sergilenir. Açılış saatleri ve ziyaret uygulamasını gitmeden önce resmî kanaldan doğrulayın.";
    museum.querySelector('.map').href = 'https://www.google.com/maps/search/?api=1&query=Batman+M%C3%BCzesi';
    museum.querySelector('.map').textContent = 'Haritada aç →';
    addSourceLink(museum, 'Batman Müzesi bilgisi ↗', 'https://tr.wikipedia.org/wiki/Batman_M%C3%BCzesi');

    const artukluBath = findCard('Artuklu Hamamı');
    artukluBath.querySelector('.cbody p').textContent = "Artuklu Hamamı, Ilısu Barajı su tutmadan önce eski Hasankeyf'ten yeni Kültürel Park'a taşınan tarihî yapılardandır. Haritada yeni ziyaret alanını eski yapı yerinden ayırın ve güncel erişimi doğrulayın.";
    artukluBath.querySelector('.map').href = 'https://www.google.com/maps/search/?api=1&query=Artuklu+Hamam%C4%B1+Hasankeyf+K%C3%BClt%C3%BCrel+Park';
    addSourceLink(artukluBath, 'Hasankeyf’te taşınan yapılar ↗', 'https://tr.wikipedia.org/wiki/Hasankeyf');

    const elRizk = findCard('El-Rızk Camii ve taşınan miras');
    elRizk.querySelector('h3').textContent = 'El-Rızk Camii ve minaresi';
    elRizk.querySelector('.cbody p').textContent = "El-Rızk Camii ve minaresi, eski Hasankeyf'ten yeni Kültürel Park'a taşınan tarihî yapılar arasındadır. Eski yerleşimdeki konumu ile bugünkü ziyaret alanını birbirinden ayırın.";
    elRizk.querySelector('.map').href = 'https://www.google.com/maps/search/?api=1&query=El-R%C4%B1zk+Camii+Hasankeyf+K%C3%BClt%C3%BCrel+Park';
    addSourceLink(elRizk, 'Hasankeyf’te taşınan yapılar ↗', 'https://tr.wikipedia.org/wiki/Hasankeyf');

    const monastery = findCard('Mor Kiryakus Manastırı');
    linkCard('Mor Kiryakus Manastırı', 'batman-mor-kiryakus');
    monastery.querySelector('.cbody p').textContent = "Beşiri'nin Ayrancı köyünde, Kıra Dağı'nın doğu yamacındaki bu Süryani manastırı koruma ve restorasyon çalışmaları görmüştür. Ziyarete açık olup olmadığını ve ulaşım koşullarını gitmeden önce doğrulayın.";
    addSourceLink(monastery, 'Kültür Portalı: Mor Kiryakus Manastırı ↗', 'https://kulturportali.gov.tr/turkiye/batman/gezilecekyer/mor-kiryakus-manastiri');

    addSourceLink(findCard('Hallan Çemi Höyüğü'), 'Hallan Çemi hakkında ↗', 'https://tr.wikipedia.org/wiki/Hallan_%C3%87emi_H%C3%B6y%C3%BC%C4%9F%C3%BC');
    addSourceLink(findCard('Kozluk Kalesi'), 'Kozluk tarihî yapıları hakkında ↗', 'https://tr.wikipedia.org/wiki/Kozluk');
    addSourceLink(findCard('İbrahim Bey Camii'), 'Kozluk tarihî yapıları hakkında ↗', 'https://tr.wikipedia.org/wiki/Kozluk');
    addSourceLink(findCard('Gercüş ilçe merkezi ve kırsal çevresi'), 'Gercüş hakkında ↗', 'https://tr.wikipedia.org/wiki/Gerc%C3%BC%C5%9F');
    addSourceLink(findCard('Sason ve Mereto Dağı manzaraları'), 'Sason ve Mereto hakkında ↗', 'https://tr.wikipedia.org/wiki/Sason');

    findCard('Sason ve Mereto Dağı manzaraları').id = 'batman-sason-mereto';
    findCard('Gercüş ilçe merkezi ve kırsal çevresi').id = 'batman-gercus';
    document.querySelector('.batman-photo-card img[src*="hasankeyf-yeni-yerlesim"]').closest('figure').querySelector('figcaption > a').href = '#batman-hasankeyf';
    document.querySelector('.batman-photo-card img[src*="batman-muzesi"]').closest('figure').querySelector('figcaption > a').href = '#batman-muzesi';
    document.querySelector('.batman-photo-card img[src*="sason-mereto-dagi"]').closest('figure').querySelector('figcaption > a').href = '#batman-sason-mereto';
    document.querySelector('.batman-photo-card img[src*="gercus.jpg"]').closest('figure').querySelector('figcaption > a').href = '#batman-gercus';
    document.querySelector('.batman-photo-card img[src*="zeynel-bey"]').closest('figure').querySelector('figcaption > a').href = '#batman-zeynel-bey';

    const videoLead = document.querySelector('#videolar .lead');
    videoLead.textContent = "Doğrulanmış tekil video bağlantısı bulunamadı; aşağıdaki başlıklar YouTube'da güncel video sonuçlarını arar.";

    const videoTopics = [
        { title: 'Mor Kiryakus Manastırı', query: 'Mor+Kiryakus+Manast%C4%B1r%C4%B1+gezi' },
        { title: 'Kozluk ve tarihî yapıları', query: 'Kozluk+Kalesi+%C4%B0brahim+Bey+Camii+Batman' },
        { title: 'Sason ve Mereto Dağı', query: 'Sason+Mereto+Da%C4%9F%C4%B1+Batman+gezi' },
        { title: 'Batman yöresel yemekleri', query: 'Batman+y%C3%B6resel+yemekler+gezi' }
    ];
    const videoGrid = document.querySelector('#videolar .grid');

    videoTopics.forEach(topic => {
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.search = `${topic.title} video youtube`;

        const band = document.createElement('div');
        band.className = 'band c-video';
        const body = document.createElement('div');
        body.className = 'cbody';
        const heading = document.createElement('h3');
        heading.textContent = topic.title;
        const description = document.createElement('p');
        description.textContent = 'İlgili güncel gezi videolarını YouTube arama sonuçlarında görüntüleyin.';
        const link = document.createElement('a');
        link.className = 'map';
        link.href = `https://www.youtube.com/results?search_query=${topic.query}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = "YouTube'da ara →";
        body.append(heading, description, link);
        card.append(band, body);
        videoGrid.appendChild(card);
    });

    const categoryForStat = ['tarihi', 'muze', 'park', 'ilce', 'lezzet'];
    const statValues = categoryForStat.map(category => Array.from(document.querySelectorAll('section.cat .card'))
        .filter(card => {
            const section = card.closest('section.cat');
            const inCategory = (card.dataset.cats || section.dataset.cat).split(/\s+/).includes(category);
            const outsideBatman = card.querySelector('h3')?.textContent.trim() === 'Malabadi Köprüsü';
            return inCategory && !(category === 'tarihi' && outsideBatman);
        }).length);
    document.querySelectorAll('.stats .stat b').forEach((stat, index) => {
        if (statValues[index] !== undefined) stat.textContent = String(statValues[index]);
    });

    document.getElementById('q').dispatchEvent(new Event('input'));
})();
