from django.db import models

from django.utils.text import slugify

CATEGORIES = (
    ('arte_computacional','Computational Art'),
    ('instalacoes','Installation'),
    ('performances','Performance'),
    ('educacao','Education'),
    ('dancatech','Dance'),
)


class Project(models.Model):
	title = models.CharField(max_length=100)
	short_description = models.TextField(default='')
	description = models.TextField(default='')
	date = models.DateField()
	category = models.CharField(max_length=150, choices=CATEGORIES,default='arte_computacional')
	front_page = models.BooleanField(default=True)
	slug = models.SlugField(editable=False, max_length=150, default='')

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


class Credit(models.Model):
	project_id = models.ForeignKey(Project, on_delete=models.CASCADE)
	title = models.CharField(max_length=100)
	name = models.CharField(max_length=100)

	def __str__(self):
		return str(self.title)+' '+str(self.name)+' ('+str(self.project_id)+')'