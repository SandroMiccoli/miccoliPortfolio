from django.contrib import admin

from .models import Project, Image, Credit, Video


class ImageInline(admin.TabularInline):
	model = Image

class CreditInline(admin.TabularInline):
	model = Credit

class VideoInline(admin.TabularInline):
	model = Video

class ProjectAdmin(admin.ModelAdmin):
	list_display = ('title', 'date')
	inlines = [
		ImageInline,
		CreditInline,
		VideoInline
	]

admin.site.register(Project, ProjectAdmin)
admin.site.register(Image)