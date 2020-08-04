import sqlite3
import pandas as pd
# Conn = sqlite3.connect('".."/data_u3sc2/northwind_small.sqlite3')
db_path = ('C:\Users\Rokshana_Parul\Desktop\ROKSHANA\Data_Engineering\Ciass_lecture_Unit3_SP2\DS-Unit-3-Sprint-2-SQL-and-Databases\Unit3Sprint2-sprint-challenge')
conn = sqlite3.connect(db_path)

# Make a cursor
curs = conn.cursor()

# Fetch all the data from northwind_small.sqlite3

curs.execute("""
SELECT name
FROM sqlite_master
WHERE type='table'
ORDER BY name;""").fetchall()

# Query to see table's schema (the `CREATE TABLE` statement)
curs.execute('SELECT sql FROM sqlite_master WHERE name="Customer";').fetchall()

########### Ten most expensive items##############

top_10_most_expensive_qry = """
SELECT prod.ProductName, prod.UnitPrice
FROM Product AS prod
ORDER BY prod.UnitPrice DESC
LIMIT 10;                """

# to print with column headings

cols = ['Product Name', 'Unit Price']


# fetch result1 with column headings
result1 = pd.DataFrame(data=curs.execute(top_10_most_expensive_qry).fetchall(), columns=cols
print('\n')
print(result1)

############## Average age of an employee #############
result2 = curs.execute(avgAge_query).fetchone()

############## Average age of an employee at hire #############
avg_age_var_by_city_qry = """
SELECT CITY, AVG(HireDate - BirthDate)
AS Avg_Age
FROM Employee GROUP BY CITY;"""
result3 = curs.execute(avg_age_var_by_city_qry).fetchall()
print(result3)


  