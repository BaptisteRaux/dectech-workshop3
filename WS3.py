import pandas as pd
from sklearn.preprocessing import LabelEncoder

def prepare_titanic_data(input_file: str, output_file: str):
    # Charger les données
    df = pd.read_csv(input_file)
    
    # Supprimer les colonnes inutiles (ex : 'Name', 'Ticket', 'Cabin')
    df.drop(columns=['Name', 'Ticket', 'Cabin'], inplace=True)
    
    # Remplacer les valeurs manquantes
    df['Age'].fillna(df['Age'].median(), inplace=True)
    df['Embarked'].fillna(df['Embarked'].mode()[0], inplace=True)
    
    
    label_encoders = {}
    for col in ['Sex', 'Embarked']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
    
    
    df.to_csv(output_file, index=False)
    print(f"Données préparées enregistrées dans {output_file}")

# Exemple d'utilisation
prepare_titanic_data('A4/Decentralizationtechnologies/Titanic-Dataset.csv', 'A4/Decentralizationtechnologies/Titanic-Cleaned.csv')


  
