README.md

# Heroku commands
~~~
heroku logs --tail
heroku run -a site-portfolio-sandromiccoli python manage.py collectstatic
heroku run -a site-portfolio-sandromiccoli python manage.py migrate
~~~

# After changing static files
~~~
python manage.py collectstatic
heroku run -a site-portfolio-sandromiccoli python manage.py collectstatic
~~~