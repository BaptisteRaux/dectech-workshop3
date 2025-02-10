import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from flask import Flask, request, jsonify, render_template_string
import numpy as np
import joblib
import requests


df = pd.read_csv("A4/Decentralizationtechnologies/Titanic-Dataset.csv")
df = df.drop(columns=["PassengerId", "Name", "Ticket", "Cabin"])

df["Age"].fillna(df["Age"].median(), inplace=True)
df["Embarked"].fillna(df["Embarked"].mode()[0], inplace=True)


label_encoders = {}
for col in ["Sex", "Embarked"]:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

X = df.drop(columns=["Survived"])
y = df["Survived"]


scaler = StandardScaler()
X = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)


model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)


y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Random Forest Classifier Accuracy: {accuracy:.4f}")

joblib.dump(model, "Titanic_RandomForest_model.pkl")
joblib.dump(label_encoders, "label_encoders.pkl")
joblib.dump(scaler, "scaler.pkl")


app = Flask(__name__)

model = joblib.load("Titanic_RandomForest_model.pkl")


label_encoders = joblib.load("label_encoders.pkl")
scaler = joblib.load("scaler.pkl")

@app.route('/')
def home():
    return render_template_string('''
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <title>Consensus Prediction</title>
        </head>
        <body>
            <div class="container">
                <h1>Consensus Prediction</h1>
                <form action="/consensus_predict" method="post">
                    <div>
                        <label for="Pclass">Pclass:</label>
                        <input type="number" id="Pclass" name="Pclass" required>
                    </div>
                    <div>
                        <label for="Sex">Sex:</label>
                        <select id="Sex" name="Sex" required>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label for="Age">Age:</label>
                        <input type="number" id="Age" name="Age" required>
                    </div>
                    <div>
                        <label for="SibSp">SibSp:</label>
                        <input type="number" id="SibSp" name="SibSp" required>
                    </div>
                    <div>
                        <label for="Parch">Parch:</label>
                        <input type="number" id="Parch" name="Parch" required>
                    </div>
                    <div>
                        <label for="Fare">Fare:</label>
                        <input type="number" id="Fare" name="Fare" required>
                    </div>
                    <div>
                        <label for="Embarked">Embarked:</label>
                        <select id="Embarked" name="Embarked" required>
                            <option value="S">S</option>
                            <option value="C">C</option>
                            <option value="Q">Q</option>
                        </select>
                    </div>
                    <button type="submit">Predict</button>
                </form>
            </div>
        </body>
        </html>
    ''')

@app.route('/consensus_predict', methods=['POST'])
def consensus_predict():
    try:
        
        Pclass = int(request.form.get('Pclass'))
        Sex = request.form.get('Sex')
        Age = float(request.form.get('Age'))
        SibSp = int(request.form.get('SibSp'))
        Parch = int(request.form.get('Parch'))
        Fare = float(request.form.get('Fare'))
        Embarked = request.form.get('Embarked')

        url1 = f"https://48cf-89-30-29-68.ngrok-free.app/predict?pclass={Pclass}&sex={Sex}&age={Age}&sibsp={SibSp}&parch={Parch}&fare={Fare}&embarked={Embarked}"
        url2 = f"https://1cc7-89-30-29-68.ngrok-free.app/predict?Pclass={Pclass}&Sex={Sex}&Age={Age}&SibSp={SibSp}&Parch={Parch}&Fare={Fare}&Embarked={Embarked}"

        
        response1 = requests.get(url1).json()
        response2 = requests.get(url2).json()

        
        probability1 = response1.get("survival_probability", 0)
        probability2 = response2.get("survival_probability", 0)

        
        Sex = label_encoders['Sex'].transform([Sex])[0]
        Embarked = label_encoders['Embarked'].transform([Embarked])[0]

        
        features = np.array([Pclass, Sex, Age, SibSp, Parch, Fare, Embarked]).reshape(1, -1)

        
        features = scaler.transform(features)

        
        local_probability = model.predict_proba(features)[0][1]

        
        
        
        consensus_probability = (local_probability + probability1 + probability2) / 3

        
        result = {
            "local_survival_probability": float(local_probability),
            "server1_survival_probability": float(probability1),
            "server2_survival_probability": float(probability2),
            "consensus_survival_probability": float(consensus_probability),
            "presentation": (
                "Voici les probabilités de survie calculées par chaque serveur "
                f"- Serveur local : {local_probability:.4f}"
                f"- Serveur 1 : {probability1:.4f}"
                f"- Serveur 2 : {probability2:.4f}"
                f"La probabilité de survie moyenne (consensus) est : {consensus_probability:.4f}."
            )
        }

        return render_template_string('''
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                <title>Consensus Prediction Result</title>
            </head>
            <body>
                <div class="container">
                    <h1>Consensus Prediction Result</h1>
                    <p>{{ presentation }}</p>
                    <p>Local Survival Probability: {{ local_survival_probability }}</p>
                    <p>Server 1 Survival Probability: {{ server1_survival_probability }}</p>
                    <p>Server 2 Survival Probability: {{ server2_survival_probability }}</p>
                    <p>Consensus Survival Probability: {{ consensus_survival_probability }}</p>
                </div>
            </body>
            </html>
        ''', **result)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
