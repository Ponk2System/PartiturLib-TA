function About() {
  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      <h1 className="display">Tentang PartiturLib</h1>
      <p className="lede" style={{ lineHeight: '1.8' }}>
        PartiturLib adalah platform Progressive Web App (PWA) yang dirancang khusus untuk mempermudah
        musisi, dirigen, arranger, dan mahasiswa musik dalam mengarsipkan, mencari, serta mempelajari berbagai
        lembar partitur musik secara digital.
      </p>
      <div style={{ marginTop: '24px', lineHeight: '1.8' }}>
        <h3>Fitur Utama:</h3>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li><strong>Upload Dokumen PDF</strong>: Unggah partitur lengkap dan sistem akan mengekstrak cover halaman 1 secara otomatis.</li>
          <li><strong>Katalog Terorganisir</strong>: Partitur dikelompokkan ke dalam Orchestra, String Section, Solo Instrument, dan lainnya.</li>
          <li><strong>Detail Musikologis</strong>: Dilengkapi komposer, arranger, tahun cipta, tingkat kesulitan, nada dasar, birama, serta daftar instrumen.</li>
          <li><strong>Penampil PDF Interaktif</strong>: Buka dan baca partitur langsung di browser atau unduh untuk latihan offline.</li>
          <li><strong>Repertoar Pribadi</strong>: Tandai dan simpan partitur yang sedang Anda pelajari.</li>
        </ul>
      </div>
    </div>
  )
}

export default About
