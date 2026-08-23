export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.query?.url || req.body?.url;
  if (!url) {
    return res.status(400).json({ error: 'Falta el parametro url' });
  }

  const match = String(url).match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match || !match[1]) {
    return res.status(400).json({ error: 'Enlace de Google Docs no valido' });
  }

  const docId = match[1];
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

  try {
    const response = await fetch(exportUrl, { redirect: 'follow' });
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Google Docs devolvio codigo ${response.status}. Asegurate de que el documento tenga permisos de lectura ('Cualquier persona con el enlace').`
      });
    }

    const text = await response.text();
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error al descargar documento de Google' });
  }
}
