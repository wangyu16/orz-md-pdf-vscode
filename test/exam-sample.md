{{nyml
kind: document
template: default
decoration_color: "#2962a4"
font_size_pt: 11
dynamic_choices: |
  answer-key: hide
}}

{{nyml
kind: element
name: exam-title-page
placement: pre-body
pagebreak_after: true
title: Midterm Examination
course: CS 101 — Introduction to Programming
instructor: Dr. A. Example
date: October 18, 2025
duration: 90 minutes
total_points: 60 pts
student_info: Full Name | Student ID | Section
instructions: |
  1. Write your name and student ID in the spaces above before starting.
  2. This exam has **two parts**: Part I is multiple choice (30 pts), Part II is short answer (30 pts).
  3. For multiple choice, circle the letter of the best answer. No partial credit.
  4. Show your work for short-answer questions. Correct answers without supporting work may not receive full credit.
  5. You may use one page of handwritten notes. No other aids are permitted.
  6. Return this exam paper when you leave. Do not detach any pages.
}}

## Part I — Multiple Choice  <span style="font-weight:normal;font-size:0.82em;opacity:0.6">(30 pts · 5 pts each)</span>

{{nyml
kind: element
name: question-mc
n: 1
pts: 5 pts
body: Which of the following is a valid Python variable name?
options: |
  A. 1stValue
  B. first_value
  C. first-value
  D. first value
answer: B
}}

{{nyml
kind: element
name: question-mc
n: 2
pts: 5 pts
body: |
  What is the output of the following code?

  ```python
  x = [1, 2, 3]
  print(x[-1])
  ```
options: |
  A. 1
  B. 3
  C. -1
  D. IndexError
answer: B
}}

{{nyml
kind: element
name: question-mc
n: 3
pts: 5 pts
body: |
  Which data structure operates on a **LIFO** (Last In, First Out) principle?
options: |
  A. Queue
  B. Linked list
  C. Stack
  D. Hash table
answer: C
}}

{{nyml
kind: element
name: question-mc
n: 4
pts: 5 pts
body: What is the time complexity of binary search on a sorted array of $n$ elements?
options: |
  A. $O(1)$
  B. $O(n)$
  C. $O(\log n)$
  D. $O(n \log n)$
answer: C
}}

{{nyml
kind: element
name: question-mc
n: 5
pts: 5 pts
body: |
  A function that calls itself to solve a smaller version of the same problem is called:
options: |
  A. An iterative function
  B. A recursive function
  C. A lambda function
  D. A generator function
answer: B
}}

{{nyml
kind: element
name: question-mc
n: 6
pts: 5 pts
body: |
  Which of the following correctly describes the purpose of the `return` statement in a function?
options: |
  A. It terminates the entire program immediately
  B. It sends a value back to the caller and ends the function
  C. It pauses the function until the next call
  D. It prints the result to the console
answer: B
}}

{{nyml
kind: pagebreak
}}

## Part II — Short Answer  <span style="font-weight:normal;font-size:0.82em;opacity:0.6">(30 pts)</span>

{{nyml
kind: element
name: question-open
n: 7
pts: 6 pts
body: |
  In your own words, explain the difference between a **list** and a **tuple** in Python. Give one reason why you might choose a tuple over a list.
space: 4cm
answer: |
  A **list** is mutable (its elements can be changed after creation), while a **tuple** is immutable (cannot be modified). You might choose a tuple when you want to ensure the data remains constant, or when using it as a dictionary key (only hashable, immutable objects can be dictionary keys).
}}

{{nyml
kind: element
name: question-open
n: 8
pts: 8 pts
body: |
  Write a Python function `count_vowels(s)` that takes a string `s` and returns the number of vowel characters (a, e, i, o, u — case insensitive) in the string.

  **Example:** `count_vowels("Hello World")` should return `3`.
space: 6cm
answer: |
  ```python
  def count_vowels(s):
      vowels = set("aeiouAEIOU")
      return sum(1 for ch in s if ch in vowels)
  ```

  Alternative: `return len([ch for ch in s.lower() if ch in "aeiou"])`
}}

{{nyml
kind: element
name: question-open
n: 9
pts: 8 pts
body: |
  Trace through the following code and show the exact output it produces. Explain what happens at each recursive call.

  ```python
  def mystery(n):
      if n <= 0:
          return 0
      return n + mystery(n - 2)

  print(mystery(5))
  ```
space: 5.5cm
answer: |
  **Call trace:**
  - `mystery(5)` → `5 + mystery(3)`
  - `mystery(3)` → `3 + mystery(1)`
  - `mystery(1)` → `1 + mystery(-1)`
  - `mystery(-1)` → `0`  (base case)

  Unwinding: `0 + 1 + 3 + 5 = 9`

  **Output:** `9`
}}

{{nyml
kind: element
name: question-open
n: 10
pts: 8 pts
body: |
  A sorted array contains 1 000 000 elements. You perform a **binary search** for a target value that is not in the array.

  a) What is the maximum number of comparisons that binary search will make?  
  b) Explain why linear search would be significantly slower for this input.
space: 5cm
answer: |
  **a)** $\lceil\log_2(1\,000\,000)\rceil = 20$ comparisons (since $2^{20} = 1\,048\,576 > 1\,000\,000$).

  **b)** Linear search checks elements one by one in the worst case, requiring up to $n = 1\,000\,000$ comparisons. Binary search eliminates half the remaining candidates at each step, so it scales as $O(\log n)$ versus $O(n)$ — a factor of ~50 000× faster for this input size.
}}
