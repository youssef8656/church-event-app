import { useEffect, useState } from 'react';
import api from '../services/api';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

export default function Food() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    api.get('/restaurants').then((res) => setRestaurants(res.data.restaurants));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-extrabold text-brand">الحفظ</h1>

      {restaurants.length === 0 ? (
        <p className="text-sm text-ink/50">No restaurants added yet.</p>
      ) : (
        <div className="">
          {/* {restaurants.map((r) => (
            <div key={r.id} className="app-card p-5">
              <h2 className="font-display font-bold text-lg">{r.name}</h2>
              {r.description && <p className="text-sm text-ink/60 mt-1">{r.description}</p>}
              <div className="mt-3 space-y-1 text-sm text-ink/50">
                {r.address && <p>📍 {r.address}</p>}
                {r.phone && <p>📞 {r.phone}</p>}
                {r.openingHours && <p>🕐 {r.openingHours}</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.mapLink && (
                  <a href={r.mapLink} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand">
                    Open in Maps →
                  </a>
                )}
                {r.menus.map((m) => (
                  <a
                    key={m.id}
                    href={`${API_ORIGIN}${m.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold px-3 py-1.5 rounded-full bg-surface-muted text-ink/70"
                  >
                    View Menu
                  </a>
                ))}
              </div>
            </div>
          ))} */}
          <section className="app-card p-5 bg-gradient-to-br from-brand text-brand-dark">
            <p className='text-ink text-center text-xl '>
                      ١ اَلسَّمَاوَاتُ تُحَدِّثُ بِمَجْدِ اللهِ، وَالْفَلَكُ يُخْبِرُ بِعَمَلِ يَدَيْهِ. ٢ يَوْمٌ إِلَى يَوْمٍ يُذِيعُ كَلاَمًا، وَلَيْلٌ إِلَى لَيْل يُبْدِي عِلْمًا. ٣ لاَ قَوْلَ وَلاَ كَلاَمَ. لاَ يُسْمَعُ صَوْتُهُمْ. ٤ فِي كُلِّ الأَرْضِ خَرَجَ مَنْطِقُهُمْ، وَإِلَى أَقْصَى الْمَسْكُونَةِ كَلِمَاتُهُمْ. جَعَلَ لِلشَّمْسِ مَسْكَنًا فِيهَا، ٥ وَهِيَ مِثْلُ الْعَرُوسِ الْخَارِجِ مِنْ حَجَلَتِهِ. يَبْتَهِجُ مِثْلَ الْجَبَّارِ لِلسِّبَاقِ فِي الطَّرِيقِ. ٦ مِنْ أَقْصَى السَّمَاوَاتِ خُرُوجُهَا، وَمَدَارُهَا إِلَى أَقَاصِيهَا، وَلاَ شَيْءَ يَخْتَفِي مِنْ حَرِّهَا. ٧ نَامُوسُ الرَّبِّ كَامِلٌ يَرُدُّ النَّفْسَ. شَهَادَاتُ الرَّبِّ صَادِقَةٌ تُصَيِّرُ الْجَاهِلَ حَكِيمًا. ٨ وَصَايَا الرَّبِّ مُسْتَقِيمَةٌ تُفَرِّحُ الْقَلْبَ. أَمْرُ الرَّبِّ طَاهِرٌ يُنِيرُ الْعَيْنَيْنِ. ٩ خَوْفُ الرَّبِّ نَقِيٌّ ثَابِتٌ إِلَى الأَبَدِ. أَحْكَامُ الرَّبِّ حَقٌّ عَادِلَةٌ كُلُّهَا. ١٠ أَشْهَى مِنَ الذَّهَبِ وَالإِبْرِيزِ الْكَثِيرِ، وَأَحْلَى مِنَ الْعَسَلِ وَقَطْرِ الشِّهَادِ. ١١ أَيْضًا عَبْدُكَ يُحَذَّرُ بِهَا، وَفِي حِفْظِهَا ثَوَابٌ عَظِيمٌ. ١٢ اَلسَّهَوَاتُ مَنْ يَشْعُرُ بِهَا؟ مِنَ الْخَطَايَا الْمُسْتَتِرَةِ أَبْرِئْنِي. ١٣ أَيْضًا مِنَ الْمُتَكَبِّرِينَ احْفَظْ عَبْدَكَ فَلاَ يَتَسَلَّطُوا عَلَيَّ. حِينَئِذٍ أَكُونُ كَامِلاً وَأَتَبَرَّأُ مِنْ ذَنْبٍ عَظِيمٍ. ١٤ لِتَكُنْ أَقْوَالُ فَمِي وَفِكْرُ قَلْبِي مَرْضِيَّةً أَمَامَكَ يَا رَبُّ، صَخْرَتِي وَوَلِيِّي. (المزامير ١٩)
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
