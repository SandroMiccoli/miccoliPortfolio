from django.contrib import admin

from .models import Project, Image


class ImageInline(admin.TabularInline):
	model = Image

class ProjectAdmin(admin.ModelAdmin):
	list_display = ('title', 'date')
	inlines = [
		ImageInline
	]

admin.site.register(Project, ProjectAdmin)
admin.site.register(Image)