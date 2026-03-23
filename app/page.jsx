import TeacherReportModule from './components/TeacherReportModule';
import dbConnect from './api/lib/dbConnect';
import SchoolSettings from './api/_/models/ai/SchoolSettings';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await dbConnect();

  let settings = await SchoolSettings.findOne({ schoolKey: 'default' }).lean();
  let homepage = settings?.homepage || { title: 'Falsy title', texts: ['Falsy texts'], photo: 'vercel.svg' };

  return <>
    <TeacherReportModule />
    <h2>{homepage.title}</h2>

    {homepage.texts && homepage.texts.map((text, i) => (
      <p key={i}>{text}</p>
    ))}

    <picture>
      <source type="image/jpeg" srcSet={homepage.photo} />
      <img style={{ "width": "100%" }} src={homepage.photo} alt={`Photo de ${homepage.title}`} loading="lazy" />
    </picture>
  </>;
}