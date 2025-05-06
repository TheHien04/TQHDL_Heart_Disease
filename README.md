# 🫀 TQHDL_Heart_Disease

**A D3.js Data Visualization Project on Heart Disease Dataset**

📌 *Course*: Data Visualization  
👥 *Team*: 11  
🧑‍🏫 *Instructor*: Nguyễn Ngọc Minh Châu  

---

## 🔍 Project Overview

This project visualizes patterns and risk factors of **heart disease** using **D3.js**.  
We explore correlations among **age**, **gender**, **BMI**, **exercise**, **smoking**, **cholesterol**, **family history**, and **stress level** to derive meaningful insights.

The dataset was preprocessed using Python and visualized through customized D3.js charts across 8 domains.

---

## 📊 Dashboard Preview

<img src="https://raw.githubusercontent.com/TheHien04/TQHDL_Heart_Disease/main/Report/dashboard_overview.png" alt="Heart Disease Dashboard" width="100%"/>

> The final dashboard combines all 8 tasks into one unified visual interface, meeting the **Bonus 3** requirement.

---
## ✅ Task Analysis & Insights

| Domain | Question                                                                                     | Chart Type | Insight                                                                 |
|--------|----------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------|
| 1      | How is heart disease distributed across different age groups?                                | Bar Chart  | Older individuals (esp. 50+) have a noticeably higher rate of heart disease. |
| 2      | How does gender correlate with heart disease prevalence?                                     | Pie Chart  | Males are more likely to develop heart disease than females.           |
| 3      | Is there a relationship between smoking status and heart disease?                            | Bar Chart  | Smokers show significantly higher incidence of heart disease.          |
| 4      | How do exercise habits influence heart disease status?                                       | Bar Chart  | Individuals with low physical activity are more prone to heart disease.|
| 5      | How does cholesterol level vary between those with and without heart disease?                | Bar Chart  | Slightly higher cholesterol observed in the heart disease group.       |
| 6      | Is there a correlation between BMI and heart disease status?                                 | Boxplot    | Median BMI is higher for those with heart disease.                     |
| 7      | Does family history increase heart disease risk?                                             | Pie Chart  | Majority of patients with heart disease also have a family history.    |
| 8      | How does cholesterol level distribution differ between males and females?                    | Bar Chart  | Female group shows slightly higher cholesterol, on average.            |

---
## 🧱 Project Structure

```bash
📁 Code D3.js/
  ├── 📁 Dashboard/           # Full dashboard (HTML, JS, CSS)
  ├── 📁 Domain 1 → 8/        # Individual D3.js visualizations
  ├── 📄 Preprocessing.ipynb  # Data preprocessing in Python
  └── 📄 Preprocessing_project_heart_disease.csv

📁 Report/
  ├── 📄 11_Report GD2.pdf    # Final report
  ├── 📄 GD1.pdf              # Mid-term feedback report

📄 project_heart_disease.csv  # Raw dataset
📄 [TQHDL_2425]Project_HeartDisease.pdf  # Project guideline
