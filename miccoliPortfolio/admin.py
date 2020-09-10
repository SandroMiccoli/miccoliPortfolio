from django.contrib import admin

from .models import Project, Image, Credit


class ImageInline(admin.TabularInline):
	model = Image

class CreditInline(admin.TabularInline):
	model = Credit

class ProjectAdmin(admin.ModelAdmin):
	list_display = ('title', 'date')
	inlines = [
		ImageInline,
		CreditInline
	]

admin.site.register(Project, ProjectAdmin)
admin.site.register(Image)