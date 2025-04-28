from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
import time
import pandas as pd
from webdriver_manager.chrome import ChromeDriverManager
import os

column_names = [
    "ID_candidat", "Scoala", "Nota_ro", "Contestatie_ro", "Nota_finala_ro",
    "Nota_mate", "Contestatie_mate", "Nota_finala_mate",
    "Limba_materna", "Nota_lm", "Contestatie_lm", "Nota_finala_lm", "Medie_en"
]
all_data = []
sector_data = []
start_time = time.time()



def scrape_current_page(driver):
    wait = WebDriverWait(driver, 20)

    wait.until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "tbody > tr")) > 0 and 
        any(tr.text.strip() for tr in d.find_elements(By.CSS_SELECTOR, "tbody > tr"))
    )   


    script = """
    const rows = Array.from(document.querySelectorAll("tbody > tr"));
return rows.map(row => {
    const cols = Array.from(row.querySelectorAll("td")).map(td => td.textContent.trim());
    return cols.length === 13 ? cols : null;
}).filter(Boolean);

    """
    data = driver.execute_script(script)
    sector_data.extend(data)  # ✅ this flattens the list







def get_sector_data(driver, year, sector):
    
    driver.get(f"http://static.evaluare.edu.ro/{year}/rezultate/{sector}")

    # get pages
    # Wait for pagination elements to load
    wait = WebDriverWait(driver, 10)
    pagination_elements = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'ul#dynatable-pagination-links-candidate-list a[data-dynatable-page]')))

    # Extract page numbers and get the maximum
    pages = max(int(el.get_attribute('data-dynatable-page')) for el in pagination_elements)


    

    sector_data.clear()
    for i in range(1, pages + 1):
        driver.get(f"http://static.evaluare.edu.ro/{year}/rezultate/{sector}/?page={i}&offset={(i-1)*25}")
        # Scrape page
        scrape_current_page(driver)

    sector_df = pd.DataFrame(sector_data, columns=column_names)
    return sector_df

    






def get_data(year):
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    
    driver.get(f"http://static.evaluare.edu.ro/{year}/rezultate/index.html")

    # find all cards
    cards = driver.find_elements(By.CSS_SELECTOR, ".card a")

    # extract county codes
    county_codes = [card.get_attribute("href").split("/")[-2] for card in cards]

    # empty df

    df = pd.DataFrame()
    judete = []

    if os.path.exists(f"{year}.csv"):
        df = pd.read_csv(f"{year}.csv")
        judete = set(df["Judet"])
    
    # print(judete)
    
    for sector in county_codes:
        if sector in judete:
            continue


        sector_time = time.time()
        sdf = get_sector_data(driver=driver, year=year, sector=sector)
        sdf.insert(0, 'Judet', sector)
        df = pd.concat([df, sdf], ignore_index=True)
        print(f"Sector: {sector:>2} | New size: {df.shape[0]:>6} | Elapsed: {time.time() - start_time:7.1f}s  | Sector: {time.time() - sector_time:6.1f}s")

        # Save to CSV
        df.to_csv(f"{year}.csv", index=False)

    print(f"Scraped {len(df)} records. Data saved to {year}.csv")

    # # Display first few rows
    # print(df.head())
  




get_data(2023)
end_time = time.time()

print(f"Execution took {end_time - start_time:.4f} seconds")