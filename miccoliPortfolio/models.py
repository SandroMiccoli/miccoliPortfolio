from django.db import models

from django.utils.text import slugify

class Project(models.Model):
	title = models.CharField(max_length=100)
	description = models.TextField()
	date = models.DateField()
	technology = models.CharField(max_length=60)
	role = models.CharField(max_length=60)
	front_page = models.BooleanField(default=True)
	slug = models.SlugField(editable=True, max_length=150, default='')

	#external link
	#colaboration
	
	def __str__(self):
		return self.title

	def save(self, *args, **kwargs):
		self.slug = slugify(self.title)
		super(Project, self).save(*args, **kwargs)

class Image(models.Model):
	project_id = models.ForeignKey(Project, on_delete=models.CASCADE)
	image = models.ImageField(upload_to='imgs/', verbose_name='Imagem')
	cover = models.BooleanField(default=False, help_text='Imagem de capa', verbose_name='Capa') # ToDo: Make value unique

	def __str__(self):
		return str(self.project_id) +' ('+str(self.image)+')'

	class Meta:
		verbose_name = 'Imagem'
		verbose_name_plural = 'Imagens'

class Category(models.Model):
	project_id = models.ForeignKey(Project, on_delete=models.DO_NOTHING)
	category = models.CharField(max_length=60)
	
	def __str__(self):
		return self.category

	class Meta:
		verbose_name = 'Category'
		verbose_name_plural = 'Categories'