import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'article',
  title: 'News Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: Rule => Rule.required() }),
    defineField({ name: 'mainImage', title: 'Main image', type: 'image', options: { hotspot: true }, validation: Rule => Rule.required() }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: ['Announcement', 'Partnerships', 'Facilities', 'Exams/Intakes', 'Cohort Updates'] },
      validation: Rule => Rule.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime', validation: Rule => Rule.required() }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3, validation: Rule => Rule.required() }),
    defineField({ name: 'body', title: 'Body', type: 'blockContent' }),
  ],
  preview: { select: { title: 'title', media: 'mainImage' } },
})
