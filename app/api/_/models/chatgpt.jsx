import { useState } from 'react';

const StudentForm = ({ model }) => {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Envoyer les données du formulaire au backend ou effectuer une autre action
    console.log('Données soumises :', formData);
    // Réinitialiser les champs du formulaire
    setFormData({});
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(model).map((key) => {
        const { type, default: defaultValue } = model[key];
        const inputName = `student_${key}`;

        if (type === String) {
          return (
            <label key={key}>
              {key}:
              <input
                type="text"
                name={inputName}
                value={formData[inputName] || defaultValue}
                onChange={handleChange}
              />
            </label>
          );
        }

        if (type === [String]) {
          return (
            <label key={key}>
              {key}:
              <input
                type="text"
                name={inputName}
                value={formData[inputName] || defaultValue.join(',')}
                onChange={(e) => {
                  const values = e.target.value.split(',');
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    [inputName]: values,
                  }));
                }}
              />
            </label>
          );
        }

        if (type === Object) {
          return (
            <div key={key}>
              <p>{key}:</p>
              {Object.keys(defaultValue).map((subKey) => {
                const subInputName = `${inputName}_${subKey}`;
                return (
                  <label key={subKey}>
                    {subKey}:
                    <input
                      type="text"
                      name={subInputName}
                      value={formData[subInputName] || defaultValue[subKey]}
                      onChange={handleChange}
                    />
                  </label>
                );
              })}
            </div>
          );
        }

        // Autres types de données non pris en charge
        return null;
      })}

      <button type="submit">Créer</button>
    </form>
  );
};

export default StudentForm;
