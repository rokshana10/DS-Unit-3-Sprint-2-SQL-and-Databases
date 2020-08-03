import sqlite3
# import os

# Open a connection to a new (blank) database file demo_data.sqlite3
conn = sqlite3.connect('demo_data.sqlite3')

print('\n')

print("CONNECTION OBJECT:", conn)

# Make a cursor
curs = conn.cursor()

print('\n')

print("CURSOR OBJECT:", curs)

print('\n')

# execute an appropriate CREATE TABLE statement to accept the above data (name the table demo)
create_query = """

CREATE TABLE IF NOT EXISTS demo (

    s varchar(50),

    x INT NOT NULL,

    y INT NOT NULL

);

"""

# Write and execute appropriate INSERT INTO statements to add the data (as shown above) to the database
curs.execute(create_query)

# Make sure to commit() so your data is saved! The file size should be non-zero.
conn.commit()

# insert_query = """ ... from https://docs.google.com/document/

#   d/10k1H_YLn9zeOiW54ZXdA5Ti0VOwQLaT81JLcU1QEAWU/edit

# Insert 1st row
curs.execute("""

INSERT INTO demo(

    s,x,y)

VALUES(

    'g', 3, 9)

    """)

# Insert 2nd row
curs.execute("""

INSERT INTO demo(

    s,x,y)

VALUES(

    'v', 5, 7)

    """)

# Insert 3rd row
curs.execute("""

INSERT INTO demo(

    s,x,y)

VALUES(

    'f', 8, 7)

    """)

conn.commit()


# Write the following queries:
#  1.Count how many rows you have - it should be 3!
sel_qry_rows_count = """

SELECT COUNT(*)

FROM demo            """

print(curs.execute(sel_qry_rows_count).fetchall())

# 2.How many rows are there where both x and y are at least 5?
x_and_y_at_least_five = """

SELECT COUNT(*)

FROM demo

WHERE demo.x >= 5 AND demo.y >= 5 """

print(curs.execute(x_and_y_at_least_five).fetchall())

# 3.How many unique values of y are there (hint - COUNT() can accept a keyword DISTINCT)?
unique_y_counts = """

SELECT COUNT(DISTINCT(demo.y))

FROM demo         """

print(curs.execute(unique_y_counts).fetchall())