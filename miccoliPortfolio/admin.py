from django.contrib import admin

from .models import Project, Image, Category


class ImageInline(admin.TabularInline):
	model = Image

class CategoryInline(admin.TabularInline):
	model = Category

class ProjectAdmin(admin.ModelAdmin):
	list_display = ('title', 'date')
	inlines = [
		ImageInline,
		CategoryInline
	]

admin.site.register(Project, ProjectAdmin)
admin.site.register(Image)
admin.site.register(Category)