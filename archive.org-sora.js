//hi
async function searchResults(keyword) {
  try {
    const searchUrl = `https://archive.org/search?query=${encodeURIComponent(keyword)}&and[]=mediatype:"movies"&output=json`;
    const response = await fetchv2(searchUrl);
    const data = await response.json();

    const results = (data.response?.docs || []).map(item => ({
      title: item.title || item.identifier,
      image: `https://archive.org/services/img/${item.identifier}`,
      href: `https://archive.org/details/${item.identifier}`,
    }));

    return JSON.stringify(results);
  } catch (e) {
    console.log("Errore searchResults:", e);
    return JSON.stringify([]);
  }
}

async function extractDetails(url) {
  try {
    const response = await fetchv2(url);
    const html = await response.text();

   
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                      html.match(/<div class="item-description">([\s\S]*?)<\/div>/i);

    const title = titleMatch ? titleMatch[1].trim() : "Archive.org Video";
    const description = descMatch ? descMatch[1].trim() : "Contenuto da Internet Archive";

    return JSON.stringify([{
      description: description,
      aliases: title,
      airdate: new Date().getFullYear().toString(),
    }]);
  } catch (e) {
    console.log("Errore extractDetails:", e);
    return JSON.stringify([{
      description: "Video da Archive.org",
      aliases: "N/A",
      airdate: "N/A"
    }]);
  }
}

async function extractEpisodes(url) {

  return JSON.stringify([{
    href: url,
    number: "1",
  }]);
}

async function extractStreamUrl(url) {
  try {
    const response = await fetchv2(url);
    const html = await response.text();

    
    const mp4Regex = /https?:\/\/[^"\s]+?\.archive\.org\/[^"\s]+?\/([^"\s]+\.mp4)/gi;
    let matches = [];
    let match;

    while ((match = mp4Regex.exec(html)) !== null) {
      matches.push(match[0]);
    }

    if (matches.length > 0) {
     
      const best = matches.sort((a, b) => {
        if (a.includes('_512kb')) return -1;
        if (b.includes('_512kb')) return 1;
        return b.length - a.length; 
      })[0];

      console.log(" Link MP4 trovato:", best);
      return best;
    }

    
    const downloadMatch = html.match(/href="(https:\/\/archive\.org\/download\/[^"]+\.mp4)"/i);
    if (downloadMatch) {
      console.log(" Link MP4 fallback trovato");
      return downloadMatch[1];
    }

    console.log(" Nessun link MP4 trovato");
    return null;
  } catch (e) {
    console.log("Errore extractStreamUrl:", e);
    return null;
  }
}
